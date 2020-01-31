/*
* Robot class for defining the API functions
*/
function Robot(robotId, apiDiv) {

  Robot.robotId = robotId;
  Robot.apiDiv = apiDiv;
  
  Robot.faces = null;
  Robot.bellyScreens = null;
  Robot.currentScreen = -1;
  Robot.sounds = null;
  Robot.tactile = null;
  
  Robot.setRobotId = function(robotId) {
    Robot.robotId = robotId;
    Robot.initialize();
  }

  Robot.initialize = function(apiDiv) {
    if (apiDiv != undefined)
      Robot.apiDiv = apiDiv;

    var dbRefAPI = firebase.database().ref(
      '/robots/' + Robot.robotId + '/customAPI/');
    dbRefAPI.on("value", Robot._updateRobotAPI);
    
    var dbRefInput = firebase.database().ref(
      '/robots/' + Robot.robotId + '/inputs/');
    dbRefInput.on("value", Robot._updateRobotInput);

    console.log("Robot initialized.");
  }

  Robot.getAPIHTML = function() {
    // TODO: This should be automatically generated
    var apiText = "";
    apiText += Robot._getAPICardHTML("robot.speak(text)",
                        "Makes the robot speak the given text out loud.",
                       "<b>text</b> is a String within single or double quotes",
                       "robot.speak(\"Hello world\");");
    apiText += Robot._getAPICardHTML("robot.moveNeck(pan, tilt)",
                        "Makes the robot's neck move to the indicated pan/tilt angles.",
                       "<b>pan</b> is an Integer representing the pan angle in degrees.<br>" +
                       "<b>tilt</b> is an Integer representing the tilt angle in degrees.",
                       "robot.moveNeck(0, -30);");
    apiText += Robot._getAPICardHTML("robot.setSpeechBubble(text)",
                        "Sets the robot's speech bubble to the given text.",
                       "<b>text</b> is a String within single or double quotes",
                       "robot.setSpeechBubble(\"Hello world\");");
    if (Robot.sounds != null && Robot.sounds.length>0)
      apiText += Robot._getAPICardHTML("robot.playSound(soundIndex)",
                        "Makes the robot play one of its preset sounds.",
                       "<b>soundIndex</b> is an Integer between 0 and " +
                        (Robot.sounds.length-1) +  ", available sounds are:" +
                        Robot._getSoundNames(),
                       "robot.playSound(0);");
    if (Robot.faces != null && Robot.faces.length>0)
      apiText += Robot._getAPICardHTML("robot.setFace(faceIndex)",
                        "Sets the robot's face to one of pre-designed faces.",
                       "<b>faceIndex</b> is an Integer between 0 and " +
                        (Robot.faces.length-1) + ", available faces are:" +
                        Robot._getFaceNames(),
                       "robot.setFace(0);");
    if (Robot.bellyScreens != null && Robot.bellyScreens.length>0){
      apiText += Robot._getAPICardHTML("robot.setScreen(screenIndex)",
                        "Sets the robot's belly screen to one of pre-designed screens.",
                       "<b>screenIndex</b> is an Integer between 0 and " +
                        (Robot.bellyScreens.length-1) + ", available screens are:" +
                        Robot._getScreenNames(),
                       "robot.setScreen(0);");
      apiText += Robot._getAPICardHTML("(sliderValue) robot.getSliderValue()",
                        "Obtains the current value of the slider on the screen.",
                       "<b>sliderValue</b> is an Integer between 0 and 100 indicating the current value of the slider.",
                       "var sliderValue = robot.getSliderValue();");
      apiText += Robot._getAPICardHTML("(buttonName) robot.waitForButton()",
                        "Makes the robot wait until a button in the screen is pressed and returns the name of the pressed button.",
                       "<b>buttonName</b> is a String that indicates the name of the button that was pressed.",
                       "var buttonName = await robot.waitForButton();");
    }

    apiText += Robot._getAPICardHTML("(sensorValue) robot.getTactileSensor(sensorName)",
                        "Obtains the current value of the indicated tactile sensor.",
                       "<b>sensorName</b> is an String corresponding to the specific sensor. (TODO include list of names here once finalized) <br>"+
                       "<b>sensorValue</b> is an Interger corresponding to the current value of the sensor. (TODO include range and meaning here once finalized)",
                       "var sensorValue = robot.getTactileSensor(\"sensor1\");");
    apiText += Robot._getAPICardHTML("robot.sleep(duration)",
                        "Makes the robot sleep for the specified duration.",
                       "<b>duration</b> is an Integer that specifies how long the robot will sleep/wait/do nothing in <i>milliseconds</i>",
                       "await robot.sleep(1000);");
    apiText += Robot._getAPICardHTML("robot.setLEDColor(r, g, b)",
                      "Changes the robot LED colors.",
                      "<b>r, g, b</b> are integers that specify the color code for the robot's LED lights",
                      "robot.currentLEDColor(128, 0, 128)");

    return apiText;
  }
  
  Robot._getAPICardHTML = function(title, description, params, example) {
    var cardText = "";
    cardText += "<div class='card mb-3'>";
    cardText += "<div class='card-body'>";
    cardText += "<h5 class='card-title'>" + title + "</h5>";
    cardText += "<h6 class='card-subtitle mb-2 text-muted'><i>" + description + "</i></h6>";
    cardText += "<p class='card-text'>" + params + "</p>";
    cardText += "<hr>";
    cardText += "<b>Example:</b> <samp>" + example + "</samp>";
    cardText += "</div></div>"
    return cardText;
  }
  
  
  Robot._getScreenNames = function() {
    return Robot._getNames(Robot.bellyScreens);
  }

  Robot._getSoundNames = function() {
    return Robot._getNames(Robot.sounds);
  }

  Robot._getFaceNames = function() {
    return Robot._getNames(Robot.faces);
  }

  Robot._getNames = function(objectList) {
    var namesText = "<ul>";
    for (var i=0; i<objectList.length; i++) {
      namesText += "<li>" + i + ": "+ objectList[i].name + "</li>";
    }
    namesText += "</ul>";
    return namesText;
  }

  /*
  * Function called when a new value is received from the database
  * @param snapshot is a snapshot of the part of the database that
  * the callback was registered
  */
  Robot._updateRobotAPI = function(snapshot) {
    var apiData = snapshot.val();
    Robot.faces = apiData.states.faces;
    Robot.bellyScreens = apiData.inputs.bellyScreens;
    Robot.sounds = apiData.actions.sounds;

    if (Robot.apiDiv != undefined) {
      Robot.apiDiv.innerHTML = Robot.getAPIHTML();
    }
  }

  Robot._updateRobotInput = function(snapshot) {
    var inputData = snapshot.val();
    Robot.tactile = inputData.tactile;
  }
  
  this.getSliderValue = function() {
    var sliderValue = null;
    if (Robot.bellyScreens!=null && Robot.currentScreen>=0 
        && Robot.currentScreen < Robot.bellyScreens.length) {
      if (Number(Robot.bellyScreens[Robot.currentScreen].slider.isShown) == 1)
        sliderValue = Number(Robot.bellyScreens[Robot.currentScreen].slider.current);
    }
    return sliderValue;
  }

  this.getTactileSensor = function(sensorName) {
    var sensorValue = null;
    if (Robot.tactile!=null) {
      sensorValue = Robot.tactile[sensorName]
    }
    return sensorValue;
  }

  this.waitForButton = async function(name) {
    var buttonPressed = null;
    
    if (Robot.bellyScreens!=null && Robot.currentScreen>=0 
        && Robot.currentScreen < Robot.bellyScreens.length) {
      var buttonList = Robot.bellyScreens[Robot.currentScreen].buttons.list;
      if (buttonList != undefined || buttonlist.length > 0) {
        if (name == undefined)
          buttonPressed = await this._waitForAnyButton();
        else
          buttonPressed = await this._waitForSpecificButton(name);
      }
    }
    else {
      console.log("The robot has no belly screen.");
    }
    
    return buttonPressed;
  } 
  
  this._waitForAnyButton = async function() {
    var date = new Date();
    var buttonList = Robot.bellyScreens[Robot.currentScreen].buttons.list;
    var buttonPressed = null;
    
    console.log("Will wait for any button.");
    var waiting = true;
    while (waiting) {
      buttonList = Robot.bellyScreens[Robot.currentScreen].buttons.list;
      for (var i=0; i<buttonList.length; i++) {
        var button = buttonList[i];
        var currentTime = date.getTime();
        var buttonTime = button.lastPressed;
        if (buttonTime>currentTime) {
          buttonPressed = buttonList[i].name
          waiting = false;
        }
      }
      if (waiting)
        await this.sleep(100);           
    }
    return buttonPressed;
  }
  
  this._waitForSpecificButton = async function(name) {
    var date = new Date();
    var buttonIndex = -1;
    var buttonList = Robot.bellyScreens[Robot.currentScreen].buttons.list;
    
    for (var i=0; i<buttonList.length; i++) {
      if (buttonList[i].name == name)
        buttonIndex = i;
    }
    
    if (buttonIndex == -1) {
      console.log("Warning: There is no button: " + name);
      return null;
    }
    else {
      console.log("Will wait for button: " + name);
      var waiting = true;
      while (waiting) {
        buttonList = Robot.bellyScreens[Robot.currentScreen].buttons.list;
        var button = buttonList[buttonIndex];
        var currentTime = date.getTime();
        var buttonTime = button.lastPressed;
        if (buttonTime>currentTime)
          waiting = false;
        else
          await this.sleep(100);           
      }
      return name;
    }
  }
  
  Robot._requestRobotAction = function(actionName, params) {
    var dbRef = firebase.database().ref("/robots/" + Robot.robotId
                                      + "/actions/" + actionName + "/");
    dbRef.update(params);
  }
  
  Robot._requestRobotState = function(stateName, newState) {
    var dbRef = firebase.database().ref("/robots/" + Robot.robotId + "/state/");
    var updates = {};
    updates[stateName] = newState;
    dbRef.update(updates);
  }

  this.speak = function(text) {
    console.log("Speaking");
    Robot._requestRobotAction("speak", {text:text});
  }
  
  this.setSpeechBubble = function(text) {
    console.log("Setting speech bubble");
    Robot._requestRobotState("currentText", text);
  }

  this.setFace = function(faceIndex){
    console.log("Setting face to " + faceIndex);
    if (faceIndex < 0 || faceIndex>=Robot.faces.length)
      console.log("Wrong face index.");
    else
      Robot._requestRobotState("currentFace", faceIndex);
  }
  
  this.setScreen = function(screenIndex){
    console.log("Setting face to " + screenIndex);
    if (screenIndex < 0 || screenIndex>=Robot.bellyScreens.length)
      console.log("Wrong screen index.");
    else {
      Robot.currentScreen = screenIndex;
      Robot._requestRobotState("currentBellyScreen", screenIndex);
    }
  }
  
  this.setEyes = function(value) {
    Robot._requestRobotState("currentEyes", value);
  }
  
  this.playSound = function(soundIndex){
    console.log("Playing sound: " + soundIndex);
    Robot._requestRobotAction("sound", {index:soundIndex});
    //TODO: Implement callback for when action is done
  }

  this.moveNeck = function(pan, tilt) {
    Robot._requestRobotAction("neck", {panAngle:pan, tiltAngle:tilt});
    //TODO: Implement callback for when action is done
  }

  this.sleep = async function(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  
  this.setLEDColor = function (r, g, b) {
    if (r > 255 || r < 0 || g > 255 || g < 0 || b > 255 || b < 0 )
      console.log("Invalid RGB values");
    else {
      console.log("Setting LED color to (" + r + ", " + g + ", " + b + ")");
      Robot._requestRobotState("currentLEDR", r);
      Robot._requestRobotState("currentLEDG", g);
      Robot._requestRobotState("currentLEDB", b);
    }
  }
  
  // TODO: Add other actions
}
