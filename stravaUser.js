const database = require('./database.js');
const axios = require('axios');
var db = database.db;

class stravaUser{
    constructor(id,token ){
	this.token = token;  
	this.id = id;
   }

    async hasValidToken(){
	//Origin can be spoofed, should look at if the provided token is valid.
	    //
	let athleteRequest = null;
	try{
	    athleteRequest = await axios.get(
	    `https://www.strava.com/api/v3/athlete`,
		    {headers:{'Authorization':`Bearer ${this.token}`}}
	    );
	}
	catch (error){
	    console.log(`An error occured while checking for a valid token,${error}`);
	    return false;

	}
	console.log(`recived status code to validation:${athleteRequest.status}`);
	return athleteRequest.status == 200; 
    }

    async hasActivities() {
	let dbRes = await db.get("SELECT * FROM polyLines WHERE uid=?",this.id); 
	return Boolean(dbRes)
    }

    async activityLoad(userRes){
	console.log(`loading activities for user with id ${this.id}`);
	if(await this.hasActivities()){
	    console.log("There are already activities in the database for this user. Not loading activities");
	    userRes.send("You couldn't register because you have already registered");
  
	}
	else{
	    let activitiesRes = await axios.get(
		'https://www.strava.com/api/v3/athlete/activities?per_page=10',
		{headers:{'Authorization':`Bearer ${this.token}`}}
	    ); 
	    console.log("ping");
	    let activities = activitiesRes.data;
	    //console.log(activities);
	    let addedActivities = 0;
	    for(let i=0; i< activities.length; i++){
		if(addedActivities>=10){
		    console.log("Enough activities added to db. Stopping");
		    break;
		}
		console.log(`Processing activity: ${activities[i].id}`);
		if(activities[i].type != "Run"){
		    console.log("Activity is not a run,skipping");
		    continue;
		}
		else{
		    addedActivities++;
		}
		 axios.get(
		    `https://www.strava.com/api/v3/activities/${activities[i].id}`,
		    {headers:{'Authorization':`Bearer ${this.token}`}}
		).then((aRes)=> {
		    db.run(
			"INSERT INTO polyLines(uid,aid,polyline) VALUES(?,?,?);",
			activities[i].athlete.id,
			activities[i].id,
			aRes.data.map.polyline
		    );
		console.log(`Inserting polyline for activity ${activities[i].id} into the database`);
	    }).catch((err)=>{console.log(`Failed to get activity with id ${activities[i].id},error: ${err}`);});
	    }
	     userRes.redirect('/registration_success');
 
	}
    }
    async deregister(){
	console.log("deleting all data for some user in the database");
	if (await this.hasValidToken()){
	     db.run(
			"DELETE FROM polyLines WHERE uid =?",
			this.id
		    );

	}
	else{
	    throw new Error('The provided authrization token is invalid');
	}
    }
}

module.exports.stravaUser = stravaUser;
