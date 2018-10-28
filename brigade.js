const { events, Job } = require("brigadier");

events.on("exec", (e, project) => {
	
	console.log("Hello logggerrrr")
})


events.on("push", (e, project) => {
  console.log("received push for commit " + e.commit)

  var testJob = new Job("test-runner")

  testJob.image = "python:3"

  testJob.tasks = [
    "echo hello"
  ]

  testJob.run().then( () => {
    console.log('I ran successfully. Thanks')
    //events.emit("test-done", e, project)
  }).catch(e => {
    console.log(e);
    console.log('I have an error. Sorry');
  })
})

events.on("test-done", (e, project) => {
  console.log("Building docker image")

  var dockerBuild = new Job("docker-build")

  dockerBuild.image = "docker:dind"
  dockerBuild.privileged = true;

  dockerBuild.env = {
    DOCKER_DRIVER: "overlay"
  }

  dockerBuild.env.DOCKER_USER = project.secrets.dockerLogin
  dockerBuild.env.DOCKER_PASS = project.secrets.dockerPass

  dockerBuild.tasks = [
    "dockerd-entrypoint.sh &",
    "sleep 20",
    "cd /src/",
    "docker build -t tettaji/brigade-test:latest .",
    "docker login -u $DOCKER_USER -p $DOCKER_PASS",
    "docker push tettaji/brigade-test:latest"
  ]

  dockerBuild.run().then( () => {
    events.emit("build-done", e, project)
  })
})

events.on("build-done", (e, project) => {
  console.log("Deploying to cluster")

  var deploy = new Job("deploy-runner", "tettaji/kubectl:1.9.0")

  deploy.tasks = [
    "cd /src",
    "kubectl apply -f deploy.yml"
  ]

  deploy.run().then( () => {
    events.emit("success", e, project)
  })
})

events.on("error1", (e, project) => { //disabled
  console.log("Notifying Slack of failure")

  var slack = new Job("slack-notify", "technosophos/slack-notify:latest", ["/slack-notify"])

  slack.storage.enabled = false
  slack.env = {
        SLACK_WEBHOOK: project.secrets.slackhook,
        SLACK_USERNAME: "BrigadeBot",
        SLACK_TITLE: "Build failed",
        SLACK_MESSAGE: "Go fix",
        SLACK_COLOR: "#ff0000"
  }
  slack.run()
})

events.on("success1", (e, project) => { //disabled
  console.log("Notifying Slack of success")

  var slack = new Job("slack-notify", "technosophos/slack-notify:latest", ["/slack-notify"])

  slack.storage.enabled = false
  slack.env = {
        SLACK_WEBHOOK: project.secrets.slackhook,
        SLACK_USERNAME: "BrigadeBot",
        SLACK_TITLE: "Build deployed",
        SLACK_MESSAGE: "Yay!",
        SLACK_COLOR: "#00ff00"
  }
  slack.run()
})
