/** 
*	@description An object for storing and editing images.
*   @class
*/
class Image_Cache {

    #canvas = null;
    #context = null;

    #image_urls = {};

    get canvas() {
        return this.#canvas;
    }
    set canvas(new_canvas) {
        this.#canvas = new_canvas;
        if (new_canvas) {
            this.#context = new_canvas.getContext('2d', { willReadFrequently: true });
        }
        else {
            this.#context = null;
        }
    }
    get context() {
        return this.#context;
    }
    get image_data() {
        return this.context.getImageData(0.0, 0.0, this.canvas.width, this.canvas.height);
    }
    set image_data(new_image_data) {
        this.context.putImageData(new_image_data, 0.0, 0.0);
    }

    /**
    *	@description Create an object representing the pixel
    *	at the related index in image data.
    *	@param {ImageData} image_data 
    *	@param {number} index
    *	@return {object} -contains the id, x, y, r, g, b, and a of the pixel.
    */
    static get_pixel_info(image_data, index) {
        //todo: maybe make a class to handle this data.
        //would allow editing the color directly acting like an 
        //interface to that data
        let data = image_data.data;
        let pixel_data = { 'id': Math.floor(index / 4) };
        if (pixel_data.id == 0) {
            pixel_data.x = 0
            pixel_data.y = 0
        }
        else {
            pixel_data.x = pixel_data.id % image_data.width
            pixel_data.y = Math.floor(pixel_data.id / image_data.width);
        }
        pixel_data.r = data[index],	// Red
            pixel_data.g = data[index + 1],	// Green
            pixel_data.b = data[index + 2],	// Blue
            pixel_data.a = data[index + 3]	// Alpha
        return pixel_data;
    }

    /**
    *	@description Set the canvas size.
    *	@param {number} width - New canvas width.
    *	@param {number} height- New canvas height.
    */
    set_canvas_size(width = this.canvas.width, height = this.canvas.height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
    *	@description Runs the provided callable for each pixel point in
    *	image_data. 
    *	@param {Function} callable - A function that take an array of numbers and a number.
    */
    for_each_pixel(callable = function (data, data_index) { }) {
        let image_data = this.image_data;
        for (let i = 0; i < image_data.data.length; i += 4) {
            callable(image_data, i);
        }
        this.image_data = image_data;
    }

    /**
    *	@description Retruns a list of the current stored urls by their ids.
    *	@return {string[]} -The list of existing url ids.
    */
    get_url_ids(){
        return Object.keys(this.#image_urls)
    }

    /**
    *	@description Retruns a cache image if one exists for the provided id.
    *	@param {string} id - The identifier for the url.
    *	@return {string} -The image url.
    */
    get_image_url(id = 'temp'){
        if (id in this.#image_urls) {
            return this.#image_urls[id];
        }
        return "";
    }

    /**
    *	@description Revoke the url held under the provide id.
    *	@param {string} id - An identifier for the url to remove.
    */
    remove_image_url(id = 'temp') {
        if (id in this.#image_urls) {
            URL.revokeObjectURL(this.#image_urls[id]);
        }
    }

    /**
    *	@description Create a image url from the canvas and stores it by the provided id.
    *	this will revoke the url used before if an id is already in use.
    *   @async
    *	@param {string} id - An identifier for the new url.
    *	@return {Promise<string>} -The new image url.
    */
    async create_image_url(id = 'temp') {
        let new_url = await new Promise((resolve, reject) => {
            this.canvas.toBlob((blob) => {
                resolve(URL.createObjectURL(blob));
            });
        });
        this.remove_image_url(id);
        this.#image_urls[id] = new_url;
        return new_url;
    }

    /**
    *	@param {HTMLCanvasElement} canvas - A canvas to used for editing.
    */
    constructor(canvas = document.createElement('canvas')) {
        this.canvas = canvas;
    }
}