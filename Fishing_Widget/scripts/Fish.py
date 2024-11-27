import random
import Objects
import json
from js import window

from enum import IntEnum

class AI_STATE(IntEnum):
    IDLE = 0
    SWIMING = 1
    PANICKED = 2
    HOOKED = 3
    SUBMERGING = 4
    SUBMERGED = 5
    SURFACING = 6


class Fish(Objects.Canvas_Object):

    def __init__(self, x:float=0, y:float=0, width:float=1, height:float=1,sprite=None, animation_data = {}, name:str="Fish", dialog_data = None):
        super().__init__(x,y,width,height,sprite,animation_data,name,dialog_data)
        self.ai_state : AI_STATE = AI_STATE.IDLE
        self.animation = "swim_right"
        self.speed = [3.0,1.0]
        self.speed_mod : float = 1.0
        self.move_location = [0,0]
        self.default_animation_speed : float = 3.0 
        self.weight : float = 1.0

        self.wait_time : float = 0.0
        self.panic_time : float = 0.0
        self.submerge_time : float = 0.0
        self.submerge_depth : float = 0.0
        self.target = None #if not hooked, then will use this to try to swim to or decide to ignore. if hooked, then will follow/stick-to it

        self.stamina : float = 100.0
        self.stamina_regen : float = 0.1 #this is base off of seconds. so delta of 0.1 would regen 0.01 per tick
    
    #test action. return bool to state if there been an interaction. default should be null
    #unless used. currently used for debugging
    def on_clicked(self)->bool:
        self.set_ai_state(AI_STATE.PANICKED)
        return True

    
    def ai_update(self,wolrd_ctx = None, delta : float = 1.0):
        if self.ai_state == AI_STATE.IDLE:
            self.wait_update(delta)
            pass
        elif self.ai_state == AI_STATE.SWIMING:
            if self.swiming_update(delta):
                if self.target != None:
                    length = self.vector_magnitude(self.target.x - self.x ,self.target.y - self.y)
                    if length < 8:
                        #self.set_ai_state(AI_STATE.HOOKED)
                        self.message_handler(self,"Bite", self.name)
                    else:
                        self.set_ai_state(AI_STATE.IDLE)
                else:
                    self.set_ai_state(AI_STATE.IDLE)
            pass
        elif self.ai_state == AI_STATE.HOOKED:
            #if self.swiming_update(delta):
            #    self.set_random_location()
            self.hook_update(delta)
            
        elif self.ai_state == AI_STATE.PANICKED:
            if self.swiming_update(delta):
                self.set_random_location()
            self.panic_update(delta)

        elif self.ai_state == AI_STATE.SUBMERGED:
            if self.swiming_update(delta):
                self.set_random_location()
            self.submerge_update(delta)
            pass
        elif self.ai_state == AI_STATE.SURFACING:
            if self.swiming_update(delta):
                self.set_random_location()
            self.surfacing_update(delta)
            pass
        elif self.ai_state == AI_STATE.SUBMERGING:
            if self.swiming_update(delta):
                self.set_random_location()
            self.submerging_update(delta)
        
        self.animation_speed = self.default_animation_speed * self.speed_mod


        if wolrd_ctx != None and (self.ai_state == AI_STATE.SWIMING or self.ai_state == AI_STATE.IDLE):
            if "bobber" in wolrd_ctx:
                bobber = wolrd_ctx["bobber"]
                bobber_x = bobber.x - bobber.width/2 
                bobber_y = bobber.y - bobber.height/2 
                dist_from_bobber = self.vector_magnitude(bobber_x - self.x ,bobber_y - self.y)
                if dist_from_bobber < 32: #note this value may be something gain from the bobber data modifed by the fish senses
                    if round(bobber_x) != round(self.x) and round(bobber_y) != round(self.y):
                        self.move_location[0] = bobber_x
                        self.move_location[1] = bobber_y
                    else:
                        self.message_handler(self,"Bite", self.name)



    def hook_update(self,delta : float = 0.1):
        if self.target == None:
            self.set_ai_state(AI_STATE.IDLE)
        else:
            length = self.vector_magnitude(self.target.x - self.x , self.target.y - self.y)
            if length > 32:
                self.target = None
            else:
                self.x = self.target.x - self.target.width
                self.y = self.target.y - self.target.height

    def swiming_update(self, delta : float = 0.1) -> bool:
        if round(self.move_location[0]) != round(self.x) and round(self.move_location[1]) != round(self.y):
            self.move_to(self.move_location[0],self.move_location[1],self.speed[0]*self.speed_mod,self.speed[1]*self.speed_mod)
        else:
            return True
        return False
    
    def wait_update(self,delta : float = 0.1):
        if self.wait_time > 0.0:
            self.wait_time =  self.wait_time - delta 
        else:
            if self.target != None:
                self.move_location[0] = self.target.x - self.target.width
                self.move_location[1] = self.target.y - self.target.height
            else:
                self.set_random_location()
            self.set_ai_state(AI_STATE.SWIMING)
    
    def panic_update(self,delta : float = 0.1):
        if self.panic_time > 0.0:
            self.panic_time =  self.panic_time - delta 
        else:
            self.set_ai_state(AI_STATE.IDLE)

    def submerge_update(self,delta : float = 0.1):
        if self.submerge_time > 0.0:
            self.submerge_time =  self.submerge_time - delta 
        else:
            self.set_ai_state(AI_STATE.SURFACING)
    
    def surfacing_update(self,delta : float = 0.1):
        if self.submerge_depth < 0.0:
            self.submerge_depth =  self.submerge_depth + delta * random.random()
        else:
            self.set_ai_state(AI_STATE.IDLE)

    def submerging_update(self,delta : float = 0.1):
        if self.submerge_depth > -1.0:
            self.submerge_depth =  self.submerge_depth - delta * random.random()
        else:
            self.set_ai_state(AI_STATE.SUBMERGED)

    def set_ai_state(self,new_state:int):
        #basicly 0 is default state and 1 is startled.
        if self.ai_state != new_state:
            self.ai_state = new_state
            if self.ai_state == AI_STATE.IDLE:
                self.wait_time = random.randint(1,25)
            elif self.ai_state == AI_STATE.PANICKED:
                self.panic_time = random.randint(5,50)
                self.speed_mod = 2.0
            elif self.ai_state == AI_STATE.SUBMERGED:
                self.submerge_time = random.randint(5,50)
                self.submerge_depth = -1.0
            else:
                self.speed_mod = 1.0

    def set_direction(self,x:float=0.0,y:float=0.0):
        super().set_direction(x,y)
        if self.direction[0] > 0:
            self.animation = "swim_right"
        elif self.direction[0] < 0:
            self.animation = "swim_left"
    
    def set_random_location(self,bounds = [0,0,0,0]):
        if self.navigation != None and bounds == [0,0,0,0]:
            if "bounds" in self.navigation:
                bounds = self.navigation["bounds"]
        self.move_location[0] = random.randrange(bounds[0],bounds[2])
        self.move_location[1] = random.randrange(bounds[1],bounds[3])

    def render(self, ctx,x_scale: float = 1.0, y_scale: float = 1.0, delta : float = 1.0):
        ctx.globalAlpha = max(self.submerge_depth+1,1)
        super().render(ctx, x_scale, y_scale, delta)
        ctx.globalAlpha = 1.0

    def __str__(self):
        return self.name