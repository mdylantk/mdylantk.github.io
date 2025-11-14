//depends on: "./scripts_js/scene.js"
//Note: this may depend on the html for id name and such
//may try to move those id to a more editable spot 
//or move the main object declaration back to the html page

import {Enumeration,Signal,Point,Viewport,CollisionMap,Scene_Object,Scene_Interface,Canvas_Scene} from "./scene.js";

class Access_Handler {
	//This allow object to connect to system it used without
	//having the scene or main decided which it gets
	//NOTE: could also make seprate object that handle diffrent scopes,
	//but require to check and assign them from a higher system
	//so this may be easier for object to find something (public/private) in the namespace
	//without being pass a ref of the namespace object nor depending on global scope
	#accesses = {}
	//the setter is most ment to set the accesses once, but not sure if the other functions are too much
	set accesses(value) {
		if (value && typeof value === 'object') {
			this.#accesses = value;
		}
	}
	get_access(name) {
		return this.#accesses[name];
	}
	//A way to add events. can add verifcation if needed
	register_access(name, event) {
		this.#accesses[name] = name;
	}
	//should not be used, but here to provide a way to handler it just incase
	remove_access(name) {
		delete this.#accesses[name]
	}
	constructor(accesses = {}) {
		this.accesses = accesses;
	}
}

class Bobber extends Scene_Object {
	line_casted_signal = new Signal();
	line_reeled_in_signal = new Signal();
	fish_hooked_signal = new Signal();
	fish_caught_signal = new Signal();
	actively_reeling = false;
	hooked_fish = null;
	//velocity = new Point(); //TODO: decide if a base class should have this. this is diffrent from direction. 
	//since it represents movement over time while direction is facing. note: direction might need to be added to the extion of the base class
	//like a canvas scene object or a character/pawnn/entity object 

	//the fisher is the reel_in_point normally. 
	reel_in_point;// = new Point();//commented out since it should be set in constructor
	//the offset is for incase the fisher can pull the rod left or right 
	reel_in_offset = new Point(0.0, 0.0); //NOTE: need to make sure the axes are floats and not ints else 
	//may be better to use a float instead of a point(old velocity use)
	reel_in_strength = 0.0;
	//how much each pull(reel-in) will add.
	base_reel_strength = 1.0;
	//but it will not exceed the max. activly reeling may use this(or half) since the reel_in_strength was for rapid clicking
	max_reel_strength = 10.0;
	//the amount the bobber will slow down when not being reel in.
	reel_drag = 1.0;

	line_length = 0.0;

	//this is to prevent accidental casting after reeling in
	cast_cooldown = 0.0;
	//not sure if this should be a property or a methood. as a methood it can return
	//either the base size or the scaled size
	get_size(scaled = true){
		const height = 8.0;
		const width = 8.0;
		if (scaled){
			return new Point(height*this.scale.x,width*this.scale.y);
		}
		return new Point(8.0,8.0);
	};
	render(delta = 1.0) {
		let size = this.get_size(false);
		return {
			type: "rect",
			color: '#8d0101ff',
			width: size.x,
			height: size.y
		}
	};
	//may need a signal for the fish to react to if the fish ever need to notify for release
	release(caught = false) {
		let released_fish = this.hooked_fish;
		if (released_fish) {
			released_fish.ai_state = Fish.AI_STATE.IDLE;
		}
		this.hooked_fish = null;
		//this.velocity.zero();
		this.reel_in_strength = 0.0;
		this.cast_cooldown = 0.5;
		if (caught) {
			this.fish_caught_signal.emit(released_fish)
		}
		else {
			this.line_reeled_in_signal.emit();
		}
		return released_fish;
	}
	//update the line length base on the distance of the bobber and reeler.
	//could add a loosen feature that acts as extra line untill it is used up(but would not move closer to the reeler untill used up)
	update_line_length() {
		this.line_length = Point.distance_to(this.position, this.reel_in_point);
	}
	update(delta = 1.0) {
		super.update(delta);
		if (this.cast_cooldown > 0.0) {
			this.cast_cooldown -= delta
		}
		if (!this.visibility) {
			return
		}
		//TODO: add a line length that is set base on the bobber distance from the reel_in_point when first reeling out
		//and each time the reeler reel in. 
		//This value will be used to reduce the distance the fish can moved when hooked if their direction is
		//would put them further away from the reeler. (so need a way to check for that. could project the move before applying.
		//could be simple as not moving if line length is too long and fish is moving away. only issue is that it wont move if at limit untill it pick a
		//direction that would loosen the line)
		let reel_in_point = Point.add(this.reel_in_point, this.reel_in_offset);
		let pull_direction = Point.normalize(Point.direction_to(this.position, reel_in_point));
		let counter_pull_direction = new Point();
		let pull_velocity = new Point();
		//NOTE: would need to handle click hold case. it similar, but diffrent
		let pull_strengh = this.reel_in_strength;
		//line distance is a counter check to line length. if line distance is shorterthan length, the fish can move around freely
		let line_distance = Point.distance_to(this.position, this.reel_in_point);
		let fish_weight = 0.0;

		if (line_distance <= 8) {
			this.reel(true);
			return;

		}
		if (this.actively_reeling) {
			pull_strengh += this.max_reel_strength;
		}

		if (this.hooked_fish) {
			counter_pull_direction.set(this.hooked_fish.direction);
			this.hooked_fish.while_hooked(reel_in_point);
			fish_weight = this.hooked_fish.weight
			if (this.hooked_fish.is_fighting) {
				let fish_strength = 5.0; //TODO: get the strength from the fish
				pull_strengh -= fish_strength;
			}
			else {
				//reduce the strengh when reeling in big fish but only to a certian about of it. This allow 
				//bigger fish to be harder without making the rapid click seem to go nowhere(or not work since it need some strength)
				pull_strengh = Math.max(pull_strengh - fish_weight / 10.0, pull_strengh / 8.0)
			}
		}
		if (pull_strengh < 0.0) {
			//fish is pulling
			if (line_distance <= this.line_length + 16.0) {
				//+16.0 is to allow the fish to move a little past the length
				pull_velocity.set(Point.multiply(counter_pull_direction, Point.convert(Math.abs(pull_strengh * delta))));
			}
		}
		else if (pull_strengh > 0.0) {
			pull_velocity.set(Point.multiply(pull_direction, Point.convert(pull_strengh * delta)));
		}
		//this is more to slow down the bobber if there no reeling, but reeling on click make it a little odd to word
		//if reel when click is held in, then this logic will be ignored when true. with clicks, this is the decay of reel
		//strength so it will come to a stop eventually.
		//using weight to slow it down faster
		if (!this.actively_reeling) {
			this.reel_in_strength -= Math.max(fish_weight / 10.0, this.reel_drag) * delta;
		}
		//this.pull_strengh = Math.floor(this.pull_strengh);
		if (this.reel_in_strength < 0.0) {
			this.reel_in_strength = 0.0;
		}
		if (Point.magnitude(pull_velocity) >= 0.1) {
			this.position.add(pull_velocity);
		}
		//double check here since this needs to be called after position is set
		//may be condensed after clean up
		if (pull_strengh > 0.0) {
			this.update_line_length();
		}
		if (this.hooked_fish) {
			if (this.hooked_fish.is_hooked()) {
				if (this.hooked_fish.is_flag_to_destory) {
					this.release();
				}
				else {
					//should add sockets and get the relitive position base off of that
					//so the fish mouth is at the bobber position. could also just use to to render where the line draws to when that get added
					//this.hooked_fish.position.set(this.position);
					//will try to offset it . need to mirror it if changing direction
					//and try to center it. both needs the fish image size(scaled)
					//NOTE: NEED WORLD SCALING else they wont be aline correctly
					//so sockets may be better. but this will be fine untill then
					//may be good to have a way to convert to viewport size just to have it
					//also need to get its size to help ajust the fish position
					let ratio = this.collsion_map.get_depth(this.position);
					//should have a way to offset the image render or well sockets be better
					//ratio do not take in account of the fish new position since new position depends on rendering sizes.
					let bobber_size = this.get_size();
					let fish_size = this.hooked_fish.get_size();
					if (this.hooked_fish.direction.x > 0){
						this.hooked_fish.position.x = this.position.x - fish_size.x*ratio +(bobber_size.x*ratio);// * 0.5;
					}
					else{
						this.hooked_fish.position.x = this.position.x;
					}
					this.hooked_fish.position.y = this.position.y - (fish_size.y*ratio* 0.5)+(bobber_size.y*ratio);
				}
			}
		}
	}
	cast(position = new Point()) {
		if (this.cast_cooldown > 0.0) {
			return;
		}
		this.position.set(position);
		this.visibility = true;
		this.update_line_length();
		this.line_casted_signal.emit();
	}
	reel(reel_in = false, pull_direction = new Point()) {
		//todo: decide on who is the handler. fish may not need to know about the bobber
		//if the bobber signal its location change and the fish listen
		//but having the fish ref bobber allow more options at the cost of both knowing each other
		//but even so the bobber need tot notify fish when it is released if fish did not trigger it(rare case?)
		if (reel_in) {
			this.visibility = false;
			return this.release(true);
		}
		else {
			//this.velocity.add(pull_direction);
			this.reel_in_strength += this.base_reel_strength;
			if (this.reel_in_strength > this.max_reel_strength) {
				this.reel_in_strength = this.max_reel_strength
			}
			//return this.hooked_fish; //not sure if it should return the fish that is currenly hooked
		}
		return null;
	}
	bite(fish = null) {
		if (fish && !this.hooked_fish) {
			this.hooked_fish = fish;
			this.fish_hooked_signal.emit(fish);
			return true;
		}
		return false
	}
	on_clicked() {
		//May have this reel itself in when clicked so it and be cast again
		console.log(this);
	}
	constructor(options = {}) {
		super(options);
		this.reel_in_point = options['reel_in_point'] || new Point();
		if (options['access_handler']) {
			let scene = options['access_handler'].get_access('scene')
			if (scene) {
				this.collsion_map = scene.get_collsion_map();
			}
		}
	}
}

class Fish extends Scene_Object {
	static AI_STATE = new Enumeration("IDLE", "SWIM", "HOOKED");
	ai_state = Fish.AI_STATE.IDLE;
	animation_frame = -1.0;
	idle_time = 1.0;
	move_to_point = new Point();
	direction = new Point();

	//ai stats for advance ai tests
	is_fighting = false;
	stamina = 100.0;

	//size may be hard to caculate outside the fish, so the fish may provide a way to get the size
	get_size(scaled = true){
		if (scaled){
			return new Point(this.animation_data["tile_x"]*this.scale.x,this.animation_data["tile_y"]*this.scale.y);
		}
		return new Point(this.animation_data["tile_x"],this.animation_data["tile_y"]);
	}
	is_hooked() {
		//a check incase additional hjooked states are added
		//or if hooked gets handled as a flag instead
		if (this.ai_state === Fish.AI_STATE.HOOKED) {
			return true;
		}
		return false;
	}
	update_animation() {
		if (this.direction.x > 0) {
			this.animation = "swim_right";
		}
		else if (this.direction.x < 0) {
			this.animation = "swim_left";
		}
	}
	pick_new_destination() {
		let bounds = this.collsion_map.get_bounds();
		let random_roll = Math.floor(Math.random() * 10) + 1;
		//console.log("roll: ", random_roll)
		if (this.collsion_map && random_roll <= 2) {
			//Note: could also add the visabilty check as a filter.
			let bobbers = this.collsion_map.get_objects({ "class_name": Bobber });
			let bobber = bobbers[0];
			if (bobber) {
				if (bobber.visibility) {
					//todo: use a diffrent state for moving to a object position 
					//this would also allow it to move closer if needed as well as decided to interact 
					//with the object when within range
					//or could have it log the bobber and if it is still nearby and active, it will attempt to bite, else remove the ref
					this.target = bobber;

					this.move_to_point.set(bobber.position);
					return
				}
			}
			//console.log(bobbers, this.collsion_map);
		}
		this.target = null;
		this.move_to_point.set(new Point(Math.max(Math.random() * bounds.max.x, bounds.min.x), Math.max(Math.random() * bounds.max.y, bounds.min.y)))
	}
	project_move(delta = 1.0, base_speed = 10.0) {
		let speed = delta * base_speed;//Note:delta will be less than 1 normally. probably should be around 1/60 or 1/30, but testing will be at 0.1
		let move_direction = Point.multiply(this.direction, Point.convert(speed));//.multiply(speed)
		return Point.add(this.position, move_direction);
	}
	move(delta = 1.0) {
		this.direction.set(Point.normalize(Point.direction_to(this.position, this.move_to_point)));
		this.position.set(this.project_move(delta));
		//let speed = delta * 10.0;//Note:delta will be less than 1 normally. probably should be around 1/60 or 1/30, but testing will be at 0.1
		//let direction = Point.normalize(Point.direction_to(this.position,this.move_to_point));
		//this.direction = direction; //setting the facing to the move direction
		//let move_direction = Point.multiply(direction,Point.convert(speed));//.multiply(speed)
		//this.position = Point.add(this.position,move_direction);
	}
	while_hooked(pull_direction = new Point()) {
		//allows the fish to decide how to react to a pull. this most likly will be called every movement update
		//basicly override the move update while being handled
		//the idea is to have it set the fish direction to someplace base on the pull direction
		if (this.is_fighting) {
			this.stamina -= 1.0;
			if (this.stamina <= 0) {
				this.is_fighting = false;
			}
		}
		else {
			this.stamina += 1.0;
			if (this.stamina >= 100) {
				this.is_fighting = true;
				//should add a bit of random and have it pick a direction
				//so it act like it tring to escape
				if (Math.random() > 0.75) {
					//move in a random direction
					this.direction.set(new Point(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0));
				}
				else {
					//move in a random diretion, but with y not progressing
					//Note: this may be better if y change isbase on the pull direction y to act as a fight against it 
					this.direction.set(new Point(Math.random() * 2.0 - 1.0, Math.random() * -1.0));
				}
				//this.direction.set(new Point(Math.random() * 2.0 - 1.0, pull_direction.y >= 0.0 ? Math.random() : Math.random()*-1.0 ));
			}
		}
		this.update_animation();
	}
	on_clicked() {
		console.log("fish is clicked");
		console.log(this, this.id, this.constructor);
		//this.destroy();
		return false; //currenly do not want to comsume the click.
		//this.scene_ref.destroy_object(this.id, this.constructor);
	}
	render(delta = 1.0) {
		let animation_data = this.animation_data[this.animation];
		let frames_data = animation_data.frames;
		this.animation_frame += this.animation_speed * delta;

		if (this.animation_frame > frames_data.length - 1.0 || this.animation_frame < 0) {
			if (this.animation_speed >= 0) {
				this.animation_frame = 0;
			}
			else {
				this.animation_frame = Math.max(frames_data.length - 1.0, 0);
			}
		}

		return {
			type: "image",
			image: this.image_source,
			x: frames_data[Math.round(this.animation_frame)][0] * this.animation_data["tile_x"],
			y: frames_data[Math.round(this.animation_frame)][1] * this.animation_data["tile_y"],
			width: this.animation_data["tile_x"],
			height: this.animation_data["tile_y"]
		}
	};
	update(delta = 1.0) {
		super.update(delta);
		if (this.ai_state === Fish.AI_STATE.IDLE) {
			//console.log(this.idle_time);
			this.idle_time -= 1.0 * delta * 10; //NOTE: updates at 1/10 seconds atm. 
			//times by 10 because before it was using delta of 1. TODO make sure the init idle time takes only a frame else all 
			//fish will do nothing for a second if spawn with the idle state
			if (this.idle_time < 0.0) {
				//console.log(this.collsion_map.get_objects());//a test to see what is returned
				this.pick_new_destination();
				this.ai_state = Fish.AI_STATE.SWIM;
			}
			return
		}
		if (this.ai_state === Fish.AI_STATE.HOOKED) {
			return
		}
		if (this.ai_state === Fish.AI_STATE.SWIM) {
			if (typeof this.move_to_point === "undefined") {
				this.pick_new_destination();
				//console.log("no move to point. generating a new one");
			}
			let distance_to_move = Point.distance_to(this.position, this.move_to_point);
			if (distance_to_move < 4.0) {
				//console.log("near the move to point");
				if (this.target) {
					//console.log("target: ", this.target);
					//Note: this is a test case to prevent fish teleport. may need a state for following target
					//since move to point may not be target position
					let distance_to_target = Point.distance_to(this.position, this.target.position);
					if (distance_to_target < 4.0) {
						//console.log("near the target");
						let random_roll = Math.floor(Math.random() * 10) + 1;
						//console.log("roll: ", random_roll);
						if (random_roll >= 5) {
							if (this.target.bite(this)) {
								this.ai_state = Fish.AI_STATE.HOOKED;
								this.target = null;
								return
							}
						}
					}
				}
				//console.log("meow at ", this.move_to_point);
				this.ai_state = Fish.AI_STATE.IDLE;
				this.idle_time = Math.random() * 10.0;
				this.target = null;
				//console.log("new state: ", this.ai_state, "idle_time: ", this.idle_time);
			}
			else {
				this.move(delta);
				this.update_animation();
			}
			return
		}

	}
	new_fish(fish_data){
		const normal_weight = 0.5;
		let weight_scaling = 1.0;
		this.fish_data = fish_data; //note may handle this as an id
		//and have a data access pass to fetch it from
		this.random = Math.random();//this is to get a value from 0-1 used to caculate aspects of the fish
		this.weight = this.random * ((this.fish_data.max_weight || 1.0) - (this.fish_data.min_weight || 1.0)) + (this.fish_data.min_weight || 1.0);
		//a test for scaling base on size. this uses existing scale, but may set it base on fish data. also storing random may not be needed
		//it currently is used as a quick way to get the orignal 0-1 value used for the weight.
		if (this.weight > normal_weight){
			weight_scaling = (this.weight-normal_weight)/100.0 + 1.0;
		}
		else{
			weight_scaling = this.weight/normal_weight;
		}
		this.scale.x = weight_scaling;
		if (weight_scaling > 2.0){
			this.scale.y = weight_scaling*0.5;
		}
		else{
			this.scale.y = weight_scaling;
		}
	}
	constructor(options = {}) {
		super(options);
		this.direction = options['direction'] || new Point();
		this.animation_data = options['animation_data'] || {};
		this.animation = options['animation'] || "swim_right";
		this.animation_speed = options['animation_speed'] || 4.0;
		//this.collsion_map = options['collsion_map'] || null;

		this.new_fish(options['fish_data'] || {});
		

		if (options['access_handler']) {
			let scene = options['access_handler'].get_access('scene')
			this.scene_ref = scene;//this is for testing
			//note: decide if the acess handler will know about the collsion map and just acess it that way
			//or do it this way.
			if (scene) {
				this.collsion_map = scene.get_collsion_map();
			}
			//this.collsion_map = options['access_handler'].get_access('collsion_map')
		}


		//console.log("ai state: ",this.ai_state, Fish.AI_STATE);
		//console.log(Fish.AI_STATE[0],Fish.AI_STATE[1],Fish.AI_STATE[2]);
		//console.log(options);
	}
}

//this is the impemention of the scene. It here so the scene can be removed of data it dose not need ref to
class Test_Scene extends Canvas_Scene {
	access_handler = null;
	handle_event(type, event) {
		//can call the function directly if exist
		//might need to check if it a function
		//console.log(type,event)
		if (type == "on_mousedown" || type == "on_touchstart") {
			//todo: set the state of the bobber to reeling(by mouse holding)
			//console.log("pressed",type,event);
			this.bobber.actively_reeling = true;
		}
		if (type == "on_mouseup" || type == "on_touchend") {
			//todo: unset the state of the bobber to reeling(by mouse holding)
			//console.log("released",type,event);
			this.bobber.actively_reeling = false;
		}
		if (this[type] && typeof this[type] === "function") {
			this[type](event)
			//may need to return if handled
			//since it may check for other cases directly afterwards
			return
		}
	}
	on_click(event) {
		if (this.viewport != null) {
			let mouse_position = new Point(event.clientX, event.clientY);
			let handled = false;
			if (this.viewport.is_in_viewport(new Point(event.clientX, event.clientY))) {
				//console.log("meow click (x,y)", event.clientX, event.clientY);
				let scene_position = Point.subtract(mouse_position, this.viewport.get_position())
				//console.log("meow scene position: ", scene_position);
				this.for_each_scene_object((scene_object) => {
					if (handled) { return; }
					if (scene_object) {
						if (scene_object.on_clicked && (
							//todo: need to check object collsion size
							//instead of staticly declare it
							scene_position.x >= scene_object.position.x &&
							scene_position.y >= scene_object.position.y &&
							scene_position.x < scene_object.position.x + 16 &&
							scene_position.y < scene_object.position.y + 16
						)) {
							handled = scene_object.on_clicked();
						}
					}
				});
				if (handled) { return; }
				//this will check if it in the playable bounds
				let bounds = this.collsion_map.get_bounds();
				//Note: the check only for moving the bobber or well stating the bobber can be place there
				//for reeling or what not, this check is not nessary unless needing to limit the vaild clickspot
				if (scene_position.x >= bounds.min.x && scene_position.x <= bounds.max.x && scene_position.y >= bounds.min.y && scene_position.y <= bounds.max.y) {
					//toggle the bobber visibility if nothing else happens. for testing, will behave diffrent when catch fish logic is added
					if (!this.bobber.visibility) {
						this.bobber.cast(scene_position);
					}
					else {
						//the -8 is to reduce the distance needed. it may be better to use the bobber height when it is added
						if (this.bobber.position.y >= this.viewport.get_height() - 8) {

							let caught_fish = this.bobber.reel(true);
							//if (caught_fish){
							//	console.log("mew caught: ", caught_fish.fish_data.name, caught_fish.fish_data);
							//}
						}
						else {
							this.bobber.reel(false, new Point(0, 4)); //TODO rod reel strength should be used. also need to pull to the caster (center)
							//so that when the fish fight logic is added, the fish will be pulled bottom center. so the normal of that times the strength
							//TODO: also add a way (signal?) so that the bobber will notify this if it out of bounds (either within reel in range or outside of cast length)
							//also cast length should limit the distance the fish can pull at the cost of the line damage base off of pull strength
							//NOTE: sometimes the fish seem to teleport to the bobber, so the fish state should be checked
						}
					}
				}

				//let bounds = this.collsion_map.get_bounds();
				//this.move_to_point = new Point(Math.max(Math.random() * bounds.max.x, bounds.min.x), Math.max(Math.random() * bounds.max.y, bounds.min.y))
			}
		}
	}
	assign_collsion_map(collsion_map) {
		super.assign_collsion_map(collsion_map);
		//overriding the get bounds as a force way to limit navvigation to half the height
		//note: generally we should not be depending on the viewport bounds
		//and use the world bounds, but at the time the background is render on the viewport
		//and could change size, so this works for now.
		collsion_map.get_bounds = () => {
			const viewport = this.viewport
			return {
				type: "square",
				get min() {
					return new Point(0.0, viewport.get_height() / 2);
				},
				get max() {
					return new Point(viewport.get_width(), viewport.get_height());
				},
			}
		}
		//temp solution for visual depth. should be viewport base reflecting on collsion
		//but here due to both objects needing it having acess to the map
		//just need it in one spot for now untill a better system is designed
		collsion_map.get_depth = (position = new Point()) => {
			return position.y / collsion_map.get_bounds().max.y;
		}
	}
	create_scene_object(scene_class, options = {}) {
		if (this.access_handler) {
			options["access_handler"] = this.access_handler;
		}
		return super.create_scene_object(scene_class, options)
	}
	//TODO:	rename and handle ratio better
	//it is the scaling of an object base on the distance from the viewport
	//(at the time of writing this) this system uses a fix depth base on the background perspective
	//and ratio is a quick hack. hight should be base on the playfeild height
	//a lerp may be useful if it is not a 0-1 case
	draw_image(ctx, image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
		let ratio = this.collsion_map.get_depth(new Point(dx,dy));
		ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth * ratio, dHeight * ratio);
	}
	draw_rect(ctx, x, y, width, height, color) {
		let ratio = this.collsion_map.get_depth(new Point(x,y));
		ctx.fillStyle = color;
		ctx.fillRect(x, y, width * ratio, height * ratio);
	}
}

async function fetch_json(url) {
	const response = await fetch(url, {
		headers: { 'Accept': 'application/json' }
	});
	return response.json()
}

//this handles the main logic. it n an object due to needing to await content
//it could be converted to a class, but this should be good enough
export var main = {
	event_list: ["click", "mousedown", "touchstart", "mouseup", "touchend", "mousemove", "touchmove"],
	animation_data: {},
	fish_data: {},
	current_scene: null,
	scene_interface: new Scene_Interface(), //this may or may not be used. it could be useful for providing extra feature to an object.
	collsion_map: new CollisionMap(), //may keep a fix ref of it and have it overriden on scene switch like originally planed... unless keeping the scene interface than may use that
	access_handler: new Access_Handler(),
	pause_state: 0,//bitflag: 0 = none, 1 = update, 2 = rendering. 3 = both,(0:update,1:rendering,2:unfocus) 
	last_update_time: Date.now(),
	last_render_time: Date.now(),
	player_data:{},//placeholder object for storing fish catched
	is_saved_locally: false,
	//both the game and scene should have a spawn/create object function
	//game version is responsible for assigning any nessary globals
	//and scene for keeping track of it
	load_player_data() {
		let loaded_data;
		this.is_saved_locally = localStorage.getItem('save_locally');
		if (this.is_saved_locally == null){
			this.is_saved_locally = confirm("Do you want to save fish catches?");
			//this is only need to run here. This is to prevent populating the local storage if not used
			if (this.is_saved_locally){
				localStorage.setItem('save_locally',true);
			}
		}
		if (this.is_saved_locally){
			loaded_data = localStorage.getItem('player_data')
		}
		else{
			loaded_data = sessionStorage.getItem('player_data');
		}
		if (loaded_data){
			try {
				this.player_data = JSON.parse(loaded_data);
				return;
			}
			catch (e) { 
				console.error("Invalid JSON string", e); 
			}
		}
		this.player_data = {
			'catches':{},
			'version':0.01
		};
	},
	save_player_data() {
		//instead of saving each element if player data, we will
		//save it as a namespace(object) unless it becomes an issue
		//also using session for now, since data may change. might add
		//a option to pick if needed.
		if (this.is_saved_locally) {
			localStorage.setItem('player_data',JSON.stringify(this.player_data));
		}
		else{
			sessionStorage.setItem('player_data',JSON.stringify(this.player_data));
		}
	},
	spawn_object(object_class, options = {}) {
		let new_object = this.current_scene.create_scene_object(object_class, options);
		return new_object
	},
	register_events() {
		let self = this;
		this.event_list.forEach((event_id) => {
			document.addEventListener(event_id, function () {
				if (self.current_scene) {
					self.current_scene.handle_event("on_" + event_id, event);
				}
			});
		});
	},
	unregister_events() {
		let self = this;
		if (self.current_scene == null) {
			return
		}
		this.event_list.forEach((event_id) => {
			document.removeEventListener(event_id, function () {
				if (self.current_scene) {
					self.current_scene.handle_event("on_" + event_id, event);
				}
			});
		});
	},
	switch_scene(scene) {
		this.unregister_events();
		this.current_scene = scene;
		this.current_scene.access_handler = this.access_handler;
		this.current_scene.assign_collsion_map(this.collsion_map);//this.collsion_map); //this may be removed later when scene take full responsibility of it
		this.register_events();
		this.scene_interface.scene = scene;
	},
	get_random_fish_data(){
		let fish_list = Object.keys(this.fish_data);
		let fish_id = fish_list[Math.floor(Math.random() * fish_list.length)];
		return this.fish_data[fish_id];
	},
	//this will only handle the standard cases. there may be other states
	pause(update = true, rendering = true) {
		if (update) {
			this.pause_state |= 1 << 0;
		}
		else {
			this.pause_state &= ~(1 << 0);
		}
		if (rendering) {
			this.pause_state |= 1 << 1;
		}
		else {
			this.pause_state &= ~(1 << 1);
		}
	},
	run_update() {
		let timestamp = Date.now();
		let delta = (timestamp - this.last_update_time) / 1000;
		this.last_update_time = timestamp;
		if (this.pause_state & 1 << 0 || this.pause_state & 1 << 2) {
			return;
		}
		this.current_scene.update(delta);
	},
	run_render_frame() {
		let timestamp = Date.now();
		let delta = (timestamp - this.last_render_time) / 1000;
		this.last_render_time = timestamp;
		if (this.pause_state & 1 << 1 || this.pause_state & 1 << 2) {
			return
		}
		this.current_scene.render(delta);
	},
	play_sound(id,volume=1.0){
		let sound = document.getElementById(id);
		if (sound){
			sound.volume = volume;
			sound.play();
			return true;
		}
		return false;
	},
	async setup() {
		let game = this; //a ref to this for the use in callables created here
		this.animation_data = await fetch_json('./data/animation_data.json');
		this.fish_data = await fetch_json('./data/fish_data.json');
		console.log(this.animation_data);
		console.log(this.fish_data);
		this.load_player_data();
		//this.player_data={'catches':{}}; //can load it here as well
		//set up acess_handler refs
		//scene currently have limited acess since most stuff
		//should be acess by other objects/componets
		//while scene interface is for spawning or removing objects owned by scene
		this.access_handler.accesses = {
			'scene': this.scene_interface,
			'collsion_map': this.collsion_map
		};
		//this.access_handler.register_access('scene', this.scene_interface);
		//this.access_handler.register_access('collsion_map', this.collsion_map);

		//ready the scene by calling switch scene with a new scene
		this.switch_scene(new Test_Scene({
			'canvas': document.getElementById("canvas_fishing_room"),
		}));

		//create the fishes
		let bounds = this.current_scene.collsion_map.get_bounds();
		let fish_list = Object.keys(this.fish_data);
		for (let i = 0; i < 16; i++) {
			let random_point = new Point(Math.max(Math.random() * bounds.max.x, bounds.min.x), Math.max(Math.random() * bounds.max.y, bounds.min.y))
			//let fish_id = fish_list[Math.floor(Math.random() * fish_list.length)];
			this.spawn_object(Fish, {
				position: random_point,
				image_source: document.getElementById("fish_image"),
				animation_data: this.animation_data.fish,
				fish_data: this.get_random_fish_data(), //need to decide on the name. fish data is what it is for that single fish, but may be misleading
				//also could have it inject the data into itself, but that will make changes harder
				//on that note, just providing the id and a acess to the fish data would be more ideal so the static data could be
				//updated without catching the old
			});
		}
		//Create the bobber object
		this.current_scene.bobber = this.spawn_object(Bobber, {
			position: new Point(bounds.max.x / 2, bounds.max.y / 2),
			visibility: false,
			reel_in_point: new Point(bounds.max.x / 2, bounds.max.y)
		});
		//listen for bobber signals to update the message box
		this.current_scene.bobber.fish_hooked_signal.subscribe(this, function (fish) {
			document.getElementById("dialog_fishing_room").innerHTML = `Hooked something.`;
			game.play_sound("quick_splash_sound");
		});
		this.current_scene.bobber.fish_caught_signal.subscribe(this, function (fish) {
			if (fish) {
				let fish_id = fish.fish_data.name;
				if (fish_id in game.player_data.catches){
					game.player_data.catches[fish_id].amount += 1;
					game.player_data.catches[fish_id].total_weight += fish.weight;
					if(fish.weight < game.player_data.catches[fish_id].min_weight){
						game.player_data.catches[fish_id].min_weight = fish.weight;
					}
					if(fish.weight > game.player_data.catches[fish_id].max_weight){
						game.player_data.catches[fish_id].max_weight = fish.weight;
					} 
				}
				else{
					game.player_data.catches[fish_id] = {};
					game.player_data.catches[fish_id].amount = 1;
					game.player_data.catches[fish_id].total_weight = fish.weight;
					game.player_data.catches[fish_id].min_weight = fish.weight;
					game.player_data.catches[fish_id].max_weight = fish.weight;
				}
				
				document.getElementById("dialog_fishing_room").innerHTML = (
					`${fish.fish_data.name} was caught weighing ${fish.weight.toFixed(2)}kg. <br>
					Caught ${game.player_data.catches[fish_id].amount} totaling ${game.player_data.catches[fish_id].total_weight.toFixed(2)}kg. <br>
					Smallest catch: ${game.player_data.catches[fish_id].min_weight.toFixed(4)}kg. <br>
					Largest catch: ${game.player_data.catches[fish_id].max_weight.toFixed(4)}kg.`
				);
				//forcing the fish to change here.NOTE: This will cause issues if not delay an update
				//it may be better or just removing and recreating it
				fish.visibility = false;
				setTimeout(function(){
					fish.new_fish(game.get_random_fish_data());
					if (Math.random() > 0.5){
						fish.position.x = bounds.max.x + fish.get_size().x
					}
					else{
						fish.position.x = bounds.min.x - fish.get_size().x
					}
					fish.position.y = Math.max(Math.random() * bounds.max.y, bounds.min.y);
					fish.visibility = true;
				}, 5000)
				//how often to save the state depends on the state use
				//breaking it up base on importaint and not may be needed
				//and update as nessary
				game.save_player_data();
				game.play_sound("splash_sound");
			}
			else {
				document.getElementById("dialog_fishing_room").innerHTML = `No fish was caught.`;
				game.play_sound("quick_splash_sound",0.5);
			}
		});

		this.current_scene.bobber.line_casted_signal.subscribe(this, function () {
			document.getElementById("dialog_fishing_room").innerHTML = `Line casted.`;
			game.play_sound("quick_splash_sound",0.5);
		});

		this.current_scene.bobber.line_reeled_in_signal.subscribe(this, function () {
			document.getElementById("dialog_fishing_room").innerHTML = `Line reeled in.`;
			game.play_sound("quick_splash_sound",0.5);
		});

		//may change this to be times per second and have value for each update and rendering
		//but will caculate the milliaseconds here to keep it simple for now.
		let update_rate = (1.0 / 30) * 1000.0; //(1/time-per-second)*1000(to convert to milliseconds))

		this.main_loop_id = setInterval(() => { this.run_update() }, update_rate);
		this.render_loop_id = setInterval(() => { this.run_render_frame() }, update_rate);

		// When the window loses focus
		window.addEventListener('blur', () => {
			this.pause_state |= 1 << 2;
		});

		// When the window gains focus
		window.addEventListener('focus', () => {
			this.pause_state &= ~(1 << 2);
		});

	},
};

