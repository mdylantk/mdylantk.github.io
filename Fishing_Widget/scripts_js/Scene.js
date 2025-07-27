//for const representation if a number. number return the id of the number and the id returns the number
//members should be an array of a type that can be identify as symbols
//TODO allow handling of objects that values are numbers and keys are symbol vaild
//NOTE: bitflags could handle the index as value, but this value need to be parced to be used as a bitflag
class enumeration {
    constructor() {
        //decided to use the arguments as the members to simplify this
        this.members = Array.from(arguments);
        for (let i = 0; i < this.members.length; i++) {
            this[this.members[i]] = i;
        }
        return Object.freeze(new Proxy(this, {
            get(target, prop, receiver) {
                if (!isNaN(prop)) {
                    return target.members[prop];
                
                }
                return Reflect.get(target, prop, receiver);
            }
        }));
    }
}

class Point{
    static default_axes = 2;
    get x(){
        return this.axes[0] || 0.0;
    }
    set x(value){
        if (value === this.axes[0] || isNaN(value)) {return}
        this.axes[0] = value;
    }
    get y(){
        return this.axes[1] || 0.0;
    }
    set y(value){
        if (value === this.axes[1] || isNaN(value)) {return}
        this.axes[1] = value;
    }
    get z(){
        return this.axes[2] || 0.0;
    }
    set z(value){
        if (value === this.axes[2] || isNaN(value)) {return}
        this.axes[2] = value;
    }
    //convert the past value to a point.
    //if it is a point, then the flag will determ if it will return 
    //a copy of it or not. it used for the copy function
    //Note: this will return a default point if value is invaild
    static convert(value, return_as_copy = false, max_axes = this.default_axes){
        if (value instanceof Point){
            if (return_as_copy){
                let point = new Point();
                point.axes = value.axes.slice()
                return point;
            }
            return value;
        }
        if (Number.isFinite(value)) {
            let point = new Point();
            point.axes = new Array(max_axes).fill(value)
            return point;
            //return new Point(value, value, value);
        }
        return new Point()
    }
    //This will return a new point from the pass value
    //but if it a number, it will make a point with all the
    //axis that value
    static copy(value){
        return this.convert(value, true);
    }
    static add(point_a, point_b){
        let new_point = new Point();
        for (let i = 0; i < point_b.axes.length; i++){
            if (!isNaN(point_a.axes[i])){
                new_point.axes[i] = point_a.axes[i] + (point_b.axes[i] || 0.0);
            }
        }
        return new_point;
    }
    
    static subtract(point_a, point_b){
        let new_point = new Point();
        for (let i = 0; i < point_b.axes.length; i++){
            if (!isNaN(point_a.axes[i])){
                new_point.axes[i] = point_a.axes[i] - (point_b.axes[i] || 0.0);
            }
        }
        return new_point;
    }
    
    static multiply(point_a, point_b){
        let new_point = new Point();
        for (let i = 0; i < point_b.axes.length; i++){
            if (!isNaN(point_a.axes[i])){
                new_point.axes[i] = point_a.axes[i] * (point_b.axes[i] || 0.0);
            }
        }
        return new_point;
    }
    
    static divide(point_a, point_b){
        let new_point = new Point();
        for (let i = 0; i < point_b.axes.length; i++){
            if (!isNaN(point_a.axes[i])){
                let point_axis = point_b.axes[i] || 0.0
                if (point_a.axes[i] != 0.0 && point_axis != 0.0){
                    new_point.axes[i] = point_a.axes[i] / point_axis;
                }
                else{
                    new_point.axes[i] = 0.0;
                }
            }
        }
        return new_point;
    }
    static magnitude(point){
        let total = 0.0;
        for (let i = 0; i < point.axes.length; i++){
            total += point.axes[i] * point.axes[i];
        }
        return Math.sqrt(total)
    }
    static normalize(point){
        let normalize_point = Point.copy(point);
        return Point.divide(normalize_point,Point.convert(Point.magnitude(point)))
        //return normalize_point.divide(this.magnitude())
    }
    static direction_to(point_a, point_b){
        return Point.subtract(point_b,point_a);
    }
    static distance_to(point_a, point_b){
        let direction = Point.direction_to(point_a,point_b);
        return Point.magnitude(direction );
    }
    //instance add is not pure and will set the value
    set(x=0.0,y=0.0){
        for (const axis of arguments) {
            if (isNaN(axis)){
                this.axes.push(0.0);
            }
            else{
                this.axes.push(axis);
            }
        }
    }
    add(value){
        let point = Point.convert(value);
        for (let i = 0; i < point.axes.length; i++){
            if (!isNaN(this.axes[i])){
                this.axes[i] += point.axes[i] || 0.0
            }
        }
    }
    subtract(value){
        let point = Point.convert(value);
        for (let i = 0; i < point.axes.length; i++){
            if (!isNaN(this.axes[i])){
                this.axes[i] -= point.axes[i] || 0.0
            }
        }
    }
    multiply(value = 1.0){
        let point = Point.convert(value);
        for (let i = 0; i < point.axes.length; i++){
            if (!isNaN(this.axes[i])){
                this.axes[i] *= point.axes[i] || 0.0;
            }
        }
    }
    divide(value = 1.0){
        let point = Point.convert(value);
        for (let i = 0; i < point.axes.length; i++){
            if (!isNaN(new_point.axes[i])){
                let point_axis = point.axes[i] || 0.0
                if (this.axes[i] != 0.0 && point_axis != 0.0){
                    this.axes[i] /= point_axis;
                }
                else{
                    this.axes[i] = 0.0;
                }
            }
        }
    }
    constructor(x=0.0, y=0.0){
        this.axes = [];
        this.set(...arguments);
    }
}

//This declare a event that will notify all subcribers by calling the callback they assign.
//used for notifing state changes without checking the state every update
//TODO: decide if the functions need to be lock (if possible) to prevent overriding them
class Signal {
    subscribers = new Map();
    emit(...args){
        this.subscribers.forEach((subscriber) => subscriber(...args));
    }
    subscribe(id,callback) {
        this.subscribers.set(id, callback);
    }
    unsubscribe(id) {
        this.subscribers.delete(id);
    }
    clear(){
        this.subscribers.clear();
    }
}

    class CollisionMap{
    is_in_bounds(value){
        return true
    }
    get_bounds(){
        return {
            type:"square",
            min: new Point(),
            max: new Point(),
        }
    }
    //this would check every object and return them if within the bounds
    //of the two points
    box_trace(cornerMin = new Point(), cornerMax = new Point()){
        return []
    }
    //this requests objects in the collsion map and the 
    //owner can extends its options. this may be a better place to handle 
    //traces and channel filter
    get_objects(options={}){
        return []
    }
}

//generic viewport object
class Viewport {   
    get_height(){
        return 0.0
    }
    get_width(){
        return 0.0
    }
    get_center(){
        return new Point(get_height()/2.0, get_width()/2.0)
    }
    get_position(){
        return new Point()
    }
    is_in_viewport(point = new Point(), local = false){
        let position = (local) ? new Point()  : this.get_position();
        return (
            point.x >= position.x && 
            point.y >= position.y && 
            point.x < (position.x + this.get_width()) && 
            point.y < (position.y + this.get_height())
            )

    }
    constructor(options = {}){
        //offset is where it exist in the scene
        this.offset = options['offset'] || new Point();
        //scale is the scale of the viewport complare to the scene
        this.scale = options['scale'] || new Point(1.0,1.0,1.0);
    }
}

class Canvas_Viewport extends Viewport {
    get_height(){
        if (this.canvas){
            return this.canvas.getBoundingClientRect().height
        }
        return 0.0
    }
    get_width(){
        if (this.canvas){
            return this.canvas.getBoundingClientRect().width
        }
        return 0.0
    }
    get_position(){
        if (this.canvas){
            //Note: vector is (width, height, depth)
            let bounds = this.canvas.getBoundingClientRect();
            return new Point(bounds.left,bounds.top)
        }
        return new Point()
    }
    constructor(options = {}){
        super(options);
        if (options['canvas']){
            this.canvas = options['canvas'];
        }
    }
}


class Scene_Object {
    //NOTE: signals first binding is the owner of the signal
    //this allow an object that listens to multiobjects know who trigger it
    visibility_signal = new Signal(); //notify when object visibilty is change. 
    collision_signal = new Signal(); //notify when collsion is change 
    enter_scene_signal = new Signal(); //should emit when added to a scene
    exit_scene_signal = new Signal(); //should emit when being remove from scene
    destroy_signal = new Signal(); //called if object is expected to be GC 

    #visibility = true;
    #collision = true;

    get visibility(){
        return this.#visibility;
    }
    set visibility(value) {
        const old_value = this.#visibility;
        this.#visibility = Boolean(value);
        if (old_value !== this.#visibility){
            this.visibility_signal.emit(this, this.#visibility);
        }
    }

    get collision(){
        return this.#collision;
    }
    set collision(value) {
        const old_value = this.#collision;
        this.#collision = Boolean(value);
        if (old_value !== this.#collision){
            this.collision_signal.emit(this, this.#collision);
        }
    }

    clear_signals(){
        this.visibility_signal.clear();
        this.collision_signal.clear();
        this.enter_scene_signal.clear();
        this.exit_scene_signal.clear();
        this.destroy_signal.clear();
    }

    on_enter_scene(){
        this.enter_scene_signal.emit(this);
    }
    on_exit_scene(){
        this.exit_scene_signal.emit(this);
    }
    on_destroy(){
        this.destroy_signal.emit(this);
        this.clear_signals();
    }

    render(){
        return {
            image:this.image_source,
            x:0,
            y:0,
            width:16,
            height:16
        }
    };
    
    update(delta = 1.0){};

    constructor(options = {}){
        console.log("mew?",options['id'], options['id'] != null ? options['id'] : -1);
        this.id = options['id'] != null ? options['id'] : -1;
        this.position = options['position'] || new Point();
        this.scale = options['scale'] || new Point(1.0,1.0,1.0);
        this.rotation = options['rotation'] || new Point();
        this.image_source = options['image_source'] || null;
        this.#visibility = options['visibility'] || this.#visibility;
        this.#collision = options['collision'] || this.#collision;
    }
}

class Scene_Interface {
    #scene = null;
    set scene(value){
        this.#scene = value;
    }
    create_object(scene_class, options = {}) {
        if (this.#scene){
            return this.#scene.create_scene_object(scene_class, options);
        }
        return null;
    }
    remove_object(object_id) {
        if (this.#scene){
            return this.#scene.remove_object(object_id,false);
        }
        return null;
    }
    destroy_object(object_id) {
        this.#scene.remove_object(object_id,true);
    }

    get_collsion_map(){
        if (this.#scene){
            return this.#scene.collsion_map;
        }
        return null;
    }

    get_viewport(){
        if (this.#scene){
            return this.#scene.viewport;
        }
        return null;
    }
}

class Scene {
    _on_clearing = new Signal();
    _object_count = 0;
    scene_objects = new Map();

    remove_object(object_id, destroy = false) {
        let scene_object = this.scene_objects.get(object_id);
        console.log("removing ", object_id, " : ", scene_object, Number.isFinite(object_id),this.scene_objects)
        if (scene_object) {
            scene_object.on_exit_scene();
            if (destroy){
                scene_object.on_destroy();
                this.scene_objects.delete(object_id);
            }
        }
        return scene_object;
    }
    
    clear() {
        this._on_clearing.emit()
        this.scene_objects.forEach(function(scene_object, object_id){
            remove_object(object_id, destroy = true);
        });

        this.scene_objects.clear();
    }

    assign_collsion_map(collsion_map){
        this.collsion_map = collsion_map;
        collsion_map.is_in_bounds = (value) => {
            let points = [];
            if (value instanceof Point){
                points.push(Point.copy(value));
            }
            else if (value instanceof Scene_Object){
                points.push(Point.copy(value.position));
            }
            console.log(points);
            return true
        }
        collsion_map.get_bounds = () =>{
            const viewport = this.viewport
            return {
                type:"square",
                get min() {
                    return new Point();
                    },
                get max() {
                    return new Point(viewport.get_width(), viewport.get_height());
                    },
            }
        }
        collsion_map.box_trace = (cornerMin = new Point(), cornerMax = new Point()) => {
            console.log(cornerMin, cornerMax);
            return []
        }
        collsion_map.get_objects = (options={"filter" : function(object){return true} }) => {
            if (typeof options.filter === "function"){
                let objects = [];
                for (const object of this.scene_objects.values()){
                    if (options.filter(object)){
                        objects.push(object);
                    }
                }
                return objects;
            }
            return Array.from(this.scene_objects.values());
        }
    }
    render() {
        //rending logic goses here
        //base scene lack content to draw on
    }

    update(delta = 1.0){
        this.scene_objects.forEach((scene_object) => {
            scene_object.update(delta);
        });
    }
    create_scene_object(scene_class, options = {}){
        let id = this._object_count;
        let events = options["events"] || {}
        events.scene = this.scene_events;
        options["events"] = events;
        options["id"] = id;
        let scene_object = new scene_class(options);
        this.scene_objects.set(id, scene_object);
        this._object_count += 1;
        scene_object.on_enter_scene();
        return scene_object;
    }
    handle_event(type,event) {
        //event logic gose here
        //base scene lack content so this may be empty 
    }
    constructor(options = {}){
        if (options['collsion_map']){
            this.assign_collsion_map(options['collsion_map']);
        }
    }
}

//scene that depends on the canvas
class Canvas_Scene extends Scene{

    can_render_scene_object(scene_object){
        //Note: could copy the point, but should try to keep most these
        //function pure unless they are setting/updating the position or something
        return this.viewport.is_in_viewport(scene_object.position)
    }
    render_scene_object(scene_object,canvas_context){
        let render_image = scene_object.render();
        if (render_image !== null) {
            if (canvas_context !== null) {
                canvas_context.drawImage(
                    render_image.image,
                    render_image.x,
                    render_image.y,
                    render_image.width,
                    render_image.height,
                    scene_object.position.x,
                    scene_object.position.y,
                    render_image.width, //TODO: times scale
                    render_image.height, //TODO: times scale
                );
            }
            else {console.log("canvas_context is null");}
        }
        else {
            console.log("render_image is null");
        }
    }

    render() {
        let canvas_context = null;
        if (this.viewport == null) {
            //Cant render if there no viewport to define where
            //well this only applies to the canvas scene that depends
            //on the canvas viewport which holds the canvas source
            return
        } 
        if (this.viewport.canvas) {
            canvas_context = this.viewport.canvas.getContext('2d');
            canvas_context.clearRect(0, 0, this.viewport.get_width(), this.viewport.get_height());
        }
        else {
            console.log("viewport canvas_source is null");
        }

        this.scene_objects.forEach((scene_object) => {
            if (this.can_render_scene_object(scene_object,canvas_context)){
                this.render_scene_object(scene_object,canvas_context);
            }
            else {console.log("object is not in view")}
        });
    }
    constructor(options = {}){
        super(options)
        //might need to verify the canvas source is the proper type
        let canvas = options['canvas'];
        if (canvas) {
            this.canvas_source = canvas;
            this.viewport = new Canvas_Viewport({'canvas':canvas});
        }
        else {
            console.log("MEOW NO VAILD CANVAS");
        }
    }
}