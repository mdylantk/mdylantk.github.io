import Scenes
import random
import math
import Objects
import Fish
from enum import IntEnum

from datetime import datetime

class INTERACTION_STATE(IntEnum):
    READY = 0
    REELING = 1
    CASTED = 2 #should be condensed into reeling
    HOOKED = 3 #should be condensed into reeling
    CATCH = 4

class Fishing_Scene(Scenes.Canvas_Scene):

    def __init__(self, id, events):
        super().__init__(id, events)
        self.objects = []
        self.title_text:str = "Title"
        self.title_source = None
        self.dialog_source = None
        self.reeling_strength = 0.0
        self.bobber = Bobber(0,0,8,8)
        self.bounds = [0,150,self.source.width,min(300,self.source.height)]
        self.interaction_state : INTERACTION_STATE = INTERACTION_STATE.READY
        self.fish_data = {} 
        self.fish_caught : Fish.Fish = None 
        self.tagged_fish = [] #this is to help notify fish that are tracking the bobber when there is a hook
        

    
    
    def set_title(self, title:str):
        if self.title_source != None:
            self.title_source.textContent = title

    def set_dialog(self, dialog:str):
        if self.dialog_source != None:
            self.dialog_source.textContent = dialog

    def handle_event(self, event):
        ctx = self.source.getContext("2d")

        if event.type == "mousedown" or event.type == "touchstart":
            bounds = self.source.getBoundingClientRect()
            x = event.clientX - bounds.left
            y = event.clientY - bounds.top
            self.on_cast(x,y)


    def on_cast(self, x : float = 0.0, y : float = 0.0):
        if self.interaction_state == INTERACTION_STATE.READY:
            for obj in self.objects:
                dist_x = x - obj.x
                dist_y = y - obj.y
                dist = math.sqrt(dist_x * dist_x + dist_y  * dist_y )
                if dist < 16:
                    obj.set_ai_state(Fish.AI_STATE.PANICKED)
                    #obj.on_clicked()
            if x > self.bounds[0] and x < self.bounds[2] and y > self.bounds[1] and y < self.bounds[3]:
                self.bobber.x = x
                self.bobber.y = y
                self.interaction_state = INTERACTION_STATE.REELING
                self.set_dialog("")
        elif self.interaction_state == INTERACTION_STATE.REELING:
            self.on_reel()

    def on_hook(self,fish:Fish.Fish = None):
        if fish != None and self.fish_caught == None:
            self.fish_caught = fish
            if self.fish_caught.name in self.fish_data.keys():
                pass
            else:
                self.generate_new_fish(fish)
            self.fish_caught.set_ai_state(Fish.AI_STATE.HOOKED)
            self.set_dialog(str(fish.name) + " is hooked.")

    def on_catch(self):
        if self.fish_caught != None:
            weight = "{:.2f}".format(self.fish_caught.weight)
            self.set_dialog(str(self.fish_caught.name) + " caught weighing " + weight +"kg")
            self.fish_caught.set_ai_state(Fish.AI_STATE.SUBMERGED)
            self.fish_caught = None
        self.interaction_state = INTERACTION_STATE.READY
        pass

    def on_reel(self) :
        self.reeling_strength = min(self.reeling_strength + 1,25)

    def reeling_update(self,delta):
        center = self.source.width/2
        fish_strength = 0.0
        if self.fish_caught != None:
            fish_strength = random.random()*self.fish_caught.weight
            #NOTE: the bobber ai(if used) should run after this and fish ai before this.
        reeling_strength = (self.reeling_strength - fish_strength) * delta
        clamped_reeling_strength = min(max(reeling_strength,0.01),4) 
        if reeling_strength > 0:
            self.bobber.move_to(center,self.source.height,clamped_reeling_strength,clamped_reeling_strength)
            if self.is_reeled_in():
                self.interaction_state = INTERACTION_STATE.READY
                self.reeling_strength = 0
                self.on_catch()
        elif reeling_strength < 0:
            #TODO: set the bobber move to location base on the fish desired location (need to set on when in hooked state still and handle how often it changes)
            #NOTE: get the rod look at direction to the fish desire location and then times it by the length of the remaining line. Then just need to pick which one
            #that has the shortest length
            pass
        if self.reeling_strength > 0:
            self.reeling_strength =  max(self.reeling_strength - delta,0)
            

    
    def is_reeled_in(self):
        return self.bobber.y >= self.source.height
    
    def is_holding_button(self,x:float=0.0,y:float=0.0) -> bool:
        if self.is_mousedown:
            button_bounds = self.get_button_bounds()
            if x >= button_bounds[0] and x <= button_bounds[0]+button_bounds[2]:
                if y >= button_bounds[1] and y <= button_bounds[1]+button_bounds[3]:
                    return True
        return False

    def render(self, delta : float = 1.0):
        ctx = self.source.getContext("2d")
        #caculate zones such as title bar and content
        width = self.source.width
        height = self.source.height
        
        ctx.reset()
        self.reeling_update(delta)

        for obj in self.objects:
            ratio = obj.y / self.bounds[3]
            if self.interaction_state == INTERACTION_STATE.REELING and self.fish_caught == None and obj.target == None:
                length = obj.vector_magnitude(self.bobber.x - obj.x ,self.bobber.y - obj.y)
                if length < 32:
                    obj.target = self.bobber
                    self.tagged_fish.append(obj)
                else:
                    obj.targer = None
                obj.ai_update({"bobber":self.bobber},delta)
            elif self.fish_caught != None and self.tagged_fish:
                #Will remove the fish target if a fish is caught on the line
                fish = self.tagged_fish.pop()
                if fish != self.fish_caught:
                    fish.target = None
            else:
                obj.ai_update(None,delta)
            obj.render(ctx,ratio,ratio,delta)

        if self.interaction_state == INTERACTION_STATE.REELING:
            ratio = self.bobber.y / self.bounds[3]
            self.bobber.render(ctx,ratio,ratio)

    def draw_bobber(self,ctx):
        self.bobber.render(ctx)

    def pick_fish_type(self):
        fish_types = self.fish_data.keys()
        if fish_types:
            return random.choice(list(self.fish_data.keys()))
        return None
    
    ##This will change the fish data so the fish object can be reused
    def generate_new_fish(self,fish):
        new_name = self.pick_fish_type()
        if new_name != None:
            min_size = self.fish_data[new_name]["min_weight"]
            max_size = self.fish_data[new_name]["max_weight"]
            fish.name = new_name
            fish.weight = random.random() * (max_size - min_size) + min_size

    def message_handler(self,object,type,message):
        if type == "Bite":
            self.on_hook(object)

    def assign_object(self,obj):
        super().assign_object(obj)
        obj.navigation = { "bounds": self.bounds}

    def on_object_state_change(self,obj):
        pass
        
    def __str__(self):
        return ("Main_Scene")
    
#declaring it here since this is the only place it will be used. other places would assume it is an object
class Bobber(Objects.Canvas_Object):
    def __init__(self, x:float=0, y:float=0, width:float=1, height:float=1,sprite=None, animation_data = {}, name:str="Bobber", dialog_data = None):
        super().__init__(x,y,width,height,sprite,animation_data,name,dialog_data)
        self.move_location = [0,0]

    def render(self, ctx,x_scale=1.0, y_scale=1.0, delta : float = 1.0):
        if self.sprite != None:
            super().render(ctx,x_scale,y_scale)
        else:
            ctx.fillStyle = 'blue'
            ctx.fillRect(
                self.x-self.width/2,
                self.y-self.height/2,
                self.width * x_scale,
                self.height * y_scale
            )



