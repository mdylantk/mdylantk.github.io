import Fishing_Scene
import json
import Fish
import random
from js import document
from js import window

fish_div = document.getElementById('fish')
local_storage = window.localStorage
scenes = {}
animation_data = {}
fish_data = {}

def handle_events(event):
	event_owner_id = event.target.id
	if event_owner_id in scenes:
		owner = scenes[event_owner_id]
		owner.handle_event(event)

common_events = {
	"click":handle_events,
	"mousedown":handle_events,
	"touchstart":handle_events,
	"mouseup":handle_events,
	"touchend":handle_events,
	"mousemove":handle_events,
	"touchmove":handle_events
}

with open('animation_data.json', 'r') as file:
	animation_data = json.load(file)
with open('fish_data.json', 'r') as file:
	fish_data = json.load(file)

scenes["canvas_fishing_room"] = Fishing_Scene.Fishing_Scene("canvas_fishing_room",common_events)
scenes["canvas_fishing_room"].title_source = document.getElementById("title_fishing_room")
scenes["canvas_fishing_room"].set_title("Fishing Room")
scenes["canvas_fishing_room"].fish_data = fish_data

bounds = scenes["canvas_fishing_room"].bounds

for i in range(0,10):
	scenes["canvas_fishing_room"].assign_object(
		Fish.Fish(random.randint(bounds[0],bounds[2]),random.randint(bounds[1],bounds[3]),16,16,document.getElementById("fish_image"), animation_data["fish"])
	)
        
scenes["canvas_fishing_room"].render()

        #this is a timer test. ensure_future was the only one that worked
import asyncio
async def update_tick():
    delta : float = 0.1
    while True:
        await asyncio.sleep(delta)
        scenes["canvas_fishing_room"].render(delta)
asyncio.ensure_future(update_tick())