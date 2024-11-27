import random
from js import document, window
from pyodide import create_proxy
from PIL import Image, ImageFilter
from datetime import datetime

##A Scene is data relating to a js element or a viewspace. It role is to handle what is displayed on it
##addition data could be provided. Owner can listen by regersting this in a diction with an id or similar base on the source
##and then use the funtion pass by the events to cross ref the ownership
class Scene:
    def __init__(self, id, events):
        self._events = {} #moving events here so thet can be unquie
        print("test")
        #this is the doctument source of the doc element that owns this. 
        self.source = document.getElementById(id)
        #an override of the bounds
        self.bounds = [0,0,self.source.width,self.source.height]
        for event_id in events:
            #event_proxy = create_proxy(events[event_id])
            self.add_event(event_id,events[event_id])

    def __del__(self):
        event_ref = self._events.copy()
        for event_id in event_ref:
            self.remove_event(event_id)

    #Note: There are also window events. either have parent handle that or  add a second group of events depenent on the window events
    def add_event(self, event_id, event):
        event_proxy = create_proxy(event)
        self.source.addEventListener(event_id, event_proxy)
        self._events[event_id] = event_proxy

    def remove_event(self, event_id):
        event_proxy = self._events[event_id]
        self.source.removeEventListener(event_id, event_proxy)
        event_proxy.destroy()
        del self._events[event_id]

    #the owner(main handler) should call  to make sure the logic runs here as well so the owner wont need to caculate everything directly
    def handle_event(self, event):
        pass

    def update(self):
        pass

##Canvas Scene is base on the canvas and will have functions for basic canvas stuff
class Canvas_Scene(Scene):

    def __init__(self, id, events):
        super().__init__(id, events)
        #NOTE: need to define objects in init else all canvas scenes will use the same array
        self.objects = []
        self.is_mousedown = False #this is a shared flag so that mouse down and up events can be handled without recreating the logic

    def render(self, delta : float = 1.0):
        ctx = self.source.getContext("2d")
        #caculate zones such as title bar and content
        width = self.source.width
        height = self.source.height
        ctx.reset()

        for obj in self.objects:
            obj.ai_update(None,delta)
            obj.render(ctx, 1.0, 1.0, delta)

    ##This sends a message from object to scene. The message is an abstract event so what is sent could be anything. An exampe is if the object want thew scen to display 'meow'
    def message_handler(self,object,type,message):
        pass

    ##this is called by object to check if a point has collsion. Will return a dictionary of data of the collsion. {"blocked":True} would mean there was collsion
    def collison_handler(self,x:float=0,y:float=0,z:float=0,data=None)-> dict:
        max_x =self.bounds[2]
        max_y = self.bounds[3]
        data = {"blocked":False}
        if x >= max_x or x <= self.bounds[0]:
            data["blocked"] = True
            data["x_blocked"] = True
        if y >= max_y or y <= self.bounds[1]:
            data["blocked"] = True
            data["y_blocked"] = True
        return data

    def assign_object(self,obj):
        #if self.objects == None:
        #    self.objects = []
        self.objects.append(obj)
        obj.notify_state_change[self]=self.on_object_state_change
        obj.collison_handler = self.collison_handler
        obj.message_handler = self.message_handler

    #These will return true if there was a change
    #but did not add condtions so it will set the flag regardless
    #these are helper private functions. on_mousedown and on_mouseup may call them to change the mousestate and use the return values to know if there is a change
    def _mousedown(self) -> bool:
        state_change = self.is_mousedown != True
        self.is_mousedown = True
        return state_change

    def _mouseup(self)-> bool:
        state_change = self.is_mousedown != False
        self.is_mousedown = False
        return state_change



            

