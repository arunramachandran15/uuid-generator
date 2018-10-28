const { events, Job } = require("brigadier");

events.on("exec", (e, project) => {
	
	console.log("Hello logggerrrr")
})


events.on("push", (e, project) => {
  console.log("received push for commit " + e.commit)
	
})

events.on("image_push", (e, p) => {
	console.log("received push for image ")
})






