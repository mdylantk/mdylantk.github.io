import math

class Canvas_Object:
    #notify are events that can be listen too. stored in a dict so it can be unregerted easier.
    #basicly instead of parent checking all the children for change, this will let the listern know there is a change
    #let say object location move, we could rerender it, but we would need to get the ctx also we need to rerender everything
    #so it better to let parent know so it can update next frame
    #notify_state_change = {}
    #collison_handler = None
   #message_handler = None #This is more of an abstract call. it currently for testing dialog. baislcy the mesage is that it want to speak something. (aka say:meow!)
    #animation_data = {}
    #animation = "idle"
    #direction = [1.0,0.0]

    def __init__(self, x:float=0, y:float=0, width:float=1, height:float=1,sprite=None, animation_data = {}, name:str="Object", dialog_data = {}):
        
        self.notify_state_change = {}
        self.collison_handler = None
        self.message_handler = None #This is more of an abstract call. it currently for testing dialog. baislcy the mesage is that it want to speak something. (aka say:meow!)
        #animation_data = {}
        self.animation = "idle"
        self.direction : list[float] = [1.0,0.0] #should only be -1, 0, or 1
        
        self.x : float = x
        self.y : float = y
        self.width : float = width
        self.height : float = height
        self.sprite = sprite
        self.animation_data = animation_data
        self.animation_speed : float = 1.0

        self.name = name
        self.dialog_source = dialog_data
        self.data = {} #this is metadata. it contains extra data that can be added, but mostlty be unused for static objects

        #this is a nav object. it should contain functions to call that the ai can used to pick a path. also could be an dict
        self.navigation = None

    def render(self, ctx,x_scale: float = 1.0, y_scale: float = 1.0, delta : float = 1.0):

        if self.sprite != None:
            if not self.animation_data:
                ctx.drawImage(self.sprite, self.x, self.y, self.width, self.height)
            else:
                frame_width = self.animation_data["tile_x"]
                frame_height = self.animation_data["tile_y"]
                frame_x = 0
                frame_y = 0
                if self.animation in self.animation_data:
                    frames_data = self.animation_data[self.animation]
                    delay = 0
                    frame_ticks = 0
                    if "frame_delay" in frames_data:
                        delay = frames_data["frame_delay"] 
                        if delay != 0 and self.animation_speed != 0:
                            #this is a fail check since dividing zero pcs usally hate. also would be pause or max speed in this case
                            delay = frames_data["frame_delay"] / (self.animation_speed * delta)
                    if "frame_ticks" in frames_data:
                        frame_ticks = frames_data["frame_ticks"]
                    current_frame = 0
                    if "current_frame" in frames_data:
                        current_frame = frames_data["current_frame"]
                    frame_x = frames_data["frames"][current_frame][1] * frame_width 
                    frame_y = frames_data["frames"][current_frame][0] * frame_height
                    if self.animation_speed == 0:
                        #if speed is 0, ignore updates since animation is paused
                        self.animation_data[self.animation]["current_frame"] = 0
                        #self.animation_data[self.animation]["frame_ticks"] = 0
                        pass
                    else:
                        if frame_ticks >= delay:
                            if (current_frame + 1) < len(frames_data["frames"]) and current_frame >= 0:
                                #note need to set it in the dict ref, not the possible clone of it
                                self.animation_data[self.animation]["current_frame"] = current_frame + 1
                        
                            #elif current_frame + 1 == len(frames_data["frames"][current_frame]):
                            #    self.animation_data["current_frame"] = 0
                            else:
                                self.animation_data[self.animation]["current_frame"] = 0

                            self.animation_data[self.animation]["frame_ticks"] = 0
                        else:
                            self.animation_data[self.animation]["frame_ticks"] = frame_ticks + 1
                            
                ctx.drawImage(
                    self.sprite, 
                    frame_x, frame_y, 
                    frame_width, 
                    frame_height, 
                    self.x, 
                    self.y, 
                    self.width * x_scale, 
                    self.height * y_scale
                    )

    def on_clicked(self)->bool:
        if True:
            #Note: no logic here, so returning false
            #below is an example of a change in state and a vaild clickable object
            return False
        else:
            self.notify(self.notify_state_change)
            return True
    
    def ai_update(self, wolrd_ctx = None, delta : float = 1.0):
        pass

    def notify(self,notify_dict):
        for listerner in notify_dict:
                notify_dict[listerner](self)

    def set_direction(self,x:float=0.0,y:float=0.0):
        self.direction[0] = x
        self.direction[1] = y

    def move_to(self,x:float=0.0,y:float=0.0, x_speed:float=1.0, y_speed:float=1.0):
        
        direction = self.normalize(x - self.x, y - self.y)
        self.set_direction(direction[0],direction[1])
        self.x += self.direction[0] * x_speed
        self.y += self.direction[1] * y_speed

    def vector_magnitude(self,x:float=0.0, y:float=0.0) -> float:
        return math.sqrt(x * x + y * y)

    def normalize(self,x:float=0.0, y:float=0.0) -> list[float]:
        return_value = [x,y]
        if x != 0 and y != 0:
            magnitude = self.vector_magnitude(x,y)
            return_value[0] = x/magnitude
            return_value[1] = y/magnitude
        return return_value


    def __str__(self):
        return ("Canvas_Object")