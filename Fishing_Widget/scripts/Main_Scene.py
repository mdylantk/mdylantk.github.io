import Scenes
import random

from datetime import datetime

class Main_Scene(Scenes.Canvas_Scene):
    
    def __init__(self, id, events):
        super().__init__(id, events)
        #NOTE: need to define objects in init else all canvas scenes will use the same array
        self.objects = []

        self.title_text:str = "Title"
        #will decide how to handle colors since some thing may use sprite sheets for textures like the title bar background(and content background)

        #could use a callable like with the events to listen for child changes, or could have the scene have functions to modify it and the object acts as data for display
        #NOTE: could keep as an array and add more var, or could change to a dict of arrays and have assign object have an optional parameter for type
        #first probably still better and then keep a function for each types. could use array/dict of arrays for z index but may be better to reserver layers thand handle dynamic layers
        #objects = []

        self.title_source = None
        #NOTE: dialog may be here and in the object depending on use case. here only if dialog is reusable, in object if each object may hove its own dialog tree
        self.dialog_source = None
    

    def set_title(self, title:str):
        if self.title_source != None:
            self.title_source.textContent = title

    def set_dialog(self, dialog:str):
        if self.dialog_source != None:
            self.dialog_source.textContent = dialog
            

    def on_object_state_change(self,obj):
        self.render()

    #def assign_object(self,obj):
    #    self.objects.append(obj)
    #    obj.notify_state_change[self]=self.on_object_state_change
    #    obj.collison_handler = self.collison_handler
    #    obj.message_handler = self.message_handler

    #handle self when there is a js event since owner should be handling the rebinding
    def handle_event(self, event):
        #ctx = self.source.getContext("2d")
        time_triggered = datetime.now()
        #self.set_dialog("the event {" + str(event.type) + "} was triggered at " + str(time_triggered)) #note: this would mess up dialog and stuff. so should only print data if no dialog is in process(or catch data in a log and flop between the two as needed)
        if event.type == "mousedown" or event.type == "touchstart":
            bounds = self.source.getBoundingClientRect()
            x = event.clientX - bounds.left
            y = event.clientY - bounds.top
            for obj in self.objects:
                if x >= obj.x and x <= obj.x + obj.width:
                    if y >= obj.y and y <= obj.y + obj.height:
                        if obj.on_clicked():
                            break

    def render(self, delta : float = 1.0):
        ctx = self.source.getContext("2d")
        #caculate zones such as title bar and content
        width = self.source.width
        height = self.source.height
        ctx.reset()

        
        #render all the objects
        for obj in self.objects:
            obj.ai_update(None,delta)
            obj.render(ctx,1.0,1.0,delta)

    #def collison_handler(self,x:float=0,y:float=0,z:float=0,data=None)-> dict:
    #    max_x =self.source.width
    #    max_y = self.source.height
    #    if x >= max_x or x <= 0:
    #        return {"blocked":True}
    #    if y >= max_y or y <= 0:
    #        return {"blocked":True}
    #    return {"blocked":False}
    
    def message_handler(self,object,type,message):
        if type == "Say":
            self.set_dialog(str(object.data["name"]) + " : " + str(message))
        
    def __str__(self):
        return ("Main_Scene")
    
    
