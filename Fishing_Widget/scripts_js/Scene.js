//About Scene (TODO: maybe rename it and handle as a proper module)
//  This provides classes to handle at least basic 2d worlds(scenes)
//  Providing ways to handle the scene objects lifetime
//  as well as providing bases to override.
//  This may be design to be used as a modual, but the main goal is
//  To provide an example to use or build upon to make simple (or more advance)
//  webbased js games.


/**
 *  @description A class to declare an object that represent an enum like type.
 *  @class
 */
class Enumeration {
    #members = [];
    /**
     * @description create an enumeration object
     * @param {...String} arguments The id of each index of the enum
     *  It will populate the object with varibles name after the id with its value as
     *  the insertion index starting with an index of 0.
     *  Note: The id of the enum can be gain by passing the index instead of the id.
     */
    constructor() {
        this.#members = Array.from(arguments);
        for (let i = 0; i < this.#members.length; i++) {
            this[this.#members[i]] = i;
        }
        return Object.freeze(new Proxy(this, {
            get(target, prop, receiver) {
                if (!isNaN(prop)) {
                    return target.#members[prop];
                
                }
                return Reflect.get(target, prop, receiver);
            }
        }));
    }
}

/** 
 *   @description A math vector (aka a point in space) that can handle multiable dimensions. 
 *   Default point will handle x,y,z, but will act more like a point2d if a z is not set
 *   @class
*/
//TODO: see if extending can override static varibles and if not, handle default_axes differently
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
    /**
     * @description Will make a new point from the provided point.
     * @param {Point} value - The point to copy.
     * @returns {Point} 
    */
    static copy(point){
        let new_point = new Point();
        new_point.axes = point.axes.slice()
        return new_point;
    }
    /**
     * @description convert the value into a point.
     * used to populate a point if a number is pass up to the max_axes.
     * @param {Point|number} value - The value to convert.
     * @param {boolean} return_as_copy - if value is a point, then this would return a new point if true.
     * @param {number} max_axes - if value is a number, then this will limit the amount of axes to populate.
     * @returns {Point} 
    */
    static convert(value, return_as_copy = false, max_axes = this.default_axes){
        if (value instanceof Point){
            if (return_as_copy){
                return Point.copy(value);
            }
            return value;
        }
        if (Number.isFinite(value)) {
            let point = new Point();
            point.axes = new Array(max_axes).fill(value)
            return point;
        }
        return new Point()
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
        return Point.divide(point,Point.convert(Point.magnitude(point)));
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
    /**
     * @description create a point object
     * @param {...float} axes sets the x,y,z of the point in that order.
     * Only the first two are used by default, but additional axes can be added
     * but only up to z have dedicated getters before needing to acess the axes array directly.
     */
    constructor(x=0.0, y=0.0){
        this.axes = [];
        this.set(...arguments);
    }
}
/** 
 *   @description Allows a way to notify change to subscribed objects
 *   @class
*/
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

/** 
 *   @description Handles fetching info about existing collsion of a scene or space
 *   @class
*/
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

/** 
 *   @description A generic viewport for declaring what is visable in a space
 *   @class
*/
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

/** 
 *   @description A viewport for declaring what is visable in a JS canvas
 *   @class
*/
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

/** 
 *   @description Base object a scene will keep track of.
 *   @class
*/
class Scene_Object {
    //NOTE: signals first binding is the owner of the signal
    //this allow an object that listens to multiobjects know who trigger it
    visibility_signal = new Signal(); //notify when object visibilty is change. 
    collision_signal = new Signal(); //notify when collsion is change 
    enter_scene_signal = new Signal(); //should emit when added to a scene
    exit_scene_signal = new Signal(); //should emit when being remove from scene
    destroy_signal = new Signal(); //called if object is expected to be GC 

    notify_signal = new Signal(); //reserve for notifing the owning scene of major changes

    #visibility = true;
    #collision = true;
    #flag_as_destory = false;

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
        this.notify_signal.clear();
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

    destroy(){
        this.#flag_as_destory = true;
        //this.notify_signal.emit(this,"destroy");
    }

    render(){
        return {
            type:"image",
            image:this.image_source,
            x:0,
            y:0,
            width:16,
            height:16
        }
    };
    
    update(delta = 1.0){
        if (this.#flag_as_destory){
            this.notify_signal.emit(this,"destroy");
            return;
        }
    };

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

/** 
 *   @description Handles interacting with a scene for indirect access
 *  NOTE: Still deciding if this should be in this name space or move to the implementation.
 *   @class
*/
class Scene_Interface {
    #scene = null;
    set scene(value){
        this.#scene = value;
    }
    create_object(scene_class, options = {}, scene = this.#scene) {
        if (scene instanceof Scene){
            return scene.create_scene_object(scene_class, options);
        }
        return null;
    }
    remove_object(object_id, object_class=null, scene = this.#scene) {
        if (scene instanceof Scene){
            return scene.remove_object(object_id,object_class,false);
        }
        return null;
    }
    destroy_object(object_id, object_class=null, scene = this.#scene) {
        if (scene instanceof Scene){
            scene.remove_object(object_id,object_class,true);
        }
    }
    get_collsion_map(scene = this.#scene){
        if (scene instanceof Scene){
            return scene.collsion_map;
        }
        return null;
    }
    get_viewport(scene = this.#scene){
        if (scene instanceof Scene){
            return scene.viewport;
        }
        return null;
    }
}
/** 
 *   @description Handles a virtual space
 *   @class
*/
class Scene {
    _on_clearing = new Signal();
    _object_count = 0;
    scene_objects = new Map();

    //NOTE: The for_each now ignore null cases TODO: remove null cases from callables since it not needed for the for_each
    //This will run the callable on each scene object
    //any function that allow filtering should try to find the class name
    //and check by class
    for_each_scene_object(callable = function(object){}){
        this.scene_objects.forEach((class_container) => {
            class_container.forEach((object) => {
                if (object) {
                    callable(object);
                }
            });
        })
    }
    for_each_scene_object_by_class(class_name, callable = function(object){}, check_inheritance = true){
        if (this.scene_objects.has(class_name) && !check_inheritance){
            let class_container = this.scene_objects.get(class_name);
            class_container.forEach((object) => {
                if (object) {
                    callable(object);
                }
            });
            //return since the flag say to not check inheritance
            return
        }
        this.scene_objects.forEach((class_container,key) => {
            if (key.prototype instanceof class_name || key == class_name){ //check if it extend the class, else ignore
                class_container.forEach((object) => {
                    if (object) {
                        callable(object);
                    }
                });
            }
            else{
                console.log(key, " is not related to ", class_name)
            }
        })
    }
    get_scene_object(id = 0, class_name = null){
        let class_container = this.scene_objects.get(class_name);
        if (class_container){
            return class_container[id];
        }
        return this.scene_objects.get(id);
    }
    remove_object(object_id, class_name = null, destroy = false) {
        //let scene_object = this.scene_objects.get(object_id);
        let scene_object = this.get_scene_object(object_id, class_name);
        console.log("removing ", class_name, object_id, " : ", scene_object,this.scene_objects);
        if (scene_object) {
            scene_object.on_exit_scene();
            if (destroy){
                scene_object.on_destroy();
                //this.scene_objects.delete(object_id);
            }
            //we will assume class container exists since scene object is vaild
            let class_container = this.scene_objects.get(class_name);
            console.log("mew?", class_container.length-1, class_container.length == object_id, object_id);
            if (class_container.length-1 == object_id){
                console.log("deleting object",class_container[class_container.length - 1]);
                class_container.pop();
                //should make sure all null values are removed
                while (class_container.length && !class_container[class_container.length - 1]) {
                    console.log("Poping object",class_container[class_container.length - 1]);
                    class_container.pop();
                }
            }
            else{
                console.log("nulling object",class_container[object_id]);
                class_container[object_id] = null;
            }
        }
        return scene_object;
    }
    create_scene_object(scene_class, options = {}){
        //TODO: make sure id assignment is correct
        let class_container;
        let id;
        let scene_object;
        let owning_scene = this;
        if (!scene_class.prototype instanceof Scene_Object){
            console.log("scene_class dose not extend Scene_Object");
        }
        if (!this.scene_objects.has(scene_class)){
            this.scene_objects.set(scene_class,[]);  
        }
        class_container = this.scene_objects.get(scene_class);
        console.log(class_container)
        id = class_container.length;
        for (let i = 0; i < class_container.length; i++) {
            if (class_container[i]){
                continue;
            }
            id = i;
            break;
        } 
        //let id = this._object_count;
        //let events = options["events"] || {}
        //events.scene = this.scene_events;
        //options["events"] = events;
        options["id"] = id;
        scene_object = new scene_class(options);
        scene_object.notify_signal.subscribe("owning_scene",function(object,notification){
            if (notification == "destroy"){
                owning_scene.remove_object(object.id,object.constructor,true);
            }
        });
        class_container[id] = scene_object;
        //this.scene_objects.set(id, scene_object);
        this._object_count += 1;
        scene_object.on_enter_scene();
        return scene_object;
    }
    clear() {
        this._on_clearing.emit()
        this.scene_objects.forEach(function(scene_object, object_id){
            remove_object(object_id, scene_object.constructor, destroy = true);
        });

        this.scene_objects.clear();
    }
    //TODO: decided if this should be kept or converted to a collsion map set up and store 
    //it the map ref to this scene
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
                let class_name = options["class_name"] || Scene_Object;

                this.for_each_scene_object_by_class(class_name,(object)=>{
                    if (options.filter(object)){
                        objects.push(object);
                    }
                })
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
        //could make a map and only add objects that have update enabled.
        //could use a string of class + id to identify them. for now this will
        //update all objects
        this.for_each_scene_object((scene_object) => {
            if (scene_object){
                scene_object.update(delta);
            }
        });
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

/** 
 *   @description Handles a virtual space base on a JS Canvas
 *   @class
*/
class Canvas_Scene extends Scene{

    can_render_scene_object(scene_object){
        //Note: could copy the point, but should try to keep most these
        //function pure unless they are setting/updating the position or something
        if(scene_object){
            if (scene_object.visibility){
                return this.viewport.is_in_viewport(scene_object.position)
            }
            return false;
        }
        return false;
    }
    render_scene_object(scene_object,canvas_context){
        let render_image = scene_object.render();
        if (render_image !== null) {
            if (canvas_context !== null) {
                if (render_image.type == "image"){
                    canvas_context.drawImage(
                        render_image.image,
                        render_image.x,
                        render_image.y,
                        render_image.width,
                        render_image.height,
                        scene_object.position.x,
                        scene_object.position.y,
                        render_image.width * scene_object.scale.x, //TODO: times scale
                        render_image.height * scene_object.scale.y, //TODO: times scale
                    );
                    return;
                }
                if (render_image.type == "rect"){
                    canvas_context.fillStyle = render_image['color'] || '#000000';
                    canvas_context.fillRect(scene_object.position.x,scene_object.position.y, render_image.width, render_image.height);
                }
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
        this.for_each_scene_object((scene_object) => {
            if (scene_object){
                if (this.can_render_scene_object(scene_object,canvas_context)){
                    this.render_scene_object(scene_object,canvas_context);
                }
                else {
                    console.log("object is not in view")
                }
            }
            else{
                console.log("null ref, either there holes in the array(fine) or the array is not resizing(not fine)")
            }
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