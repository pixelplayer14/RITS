const express = require('express');
const https = require('node:https');
const app = express();
const path = require('path');
const stravaAPI = require('strava-v3')
const database = require('./database.js');
const stravaUser= require('./stravaUser.js'); 
const sqlite3 = require('sqlite3').verbose();
 

 
const db = database.db;

//File directory
stravaAPI.config({
    "access_token"  : "3dd200b8465e347cc89f86af777a1d0b50fc1ab0",
    "client_id"     : "123086",
    "client_secret" : "3ea6193a6e439c60ff7effde2236c38195092b8f",
    "redirect_uri"  : "localhost:8080/redirect"
});

//Start Database
function insertUser(id, access_token, refresh_token, expiration_time){
    //Don't allow override:allows to be refreshed always. Delete if revoked
    //the first point is already taken care of by requiring  to sent along the token.
    //Now should just not load if somethnig already exists in the database.
    db.run("INSERT OR REPLACE INTO users(id,access_token,refresh_token,expiration_time) VALUES (?,?,?,?)", id, access_token, refresh_token,expiration_time);
}

//END database


//API calls
app.get('/register', function(req, res) {
    //this is the authorization code. We need an access token
    let authorization_code = req.query.code;
    let request = stravaAPI.oauth.getToken(authorization_code)
    request.then((stravaRes) =>
    {	
	insertUser(stravaRes.athlete.id,stravaRes.access_token,stravaRes.refresh_token,stravaRes.expires_at); 
	res.redirect(`/register/activity_load?id=${stravaRes.athlete.id}&token=${stravaRes.access_token}`);
    }).catch((e)=> {
	console.log("Failed to register user, rejected with error:", e);
	res.redirect('/register/registration_failure.html');
    });
});

//load polylines into the database from all past activities
app.get('/register/activity_load',function(req,res){
    console.log(req.query);
    let token = req.query.token;
    let id = req.query.id;
    let user = new stravaUser.stravaUser(id,token);
    user.activityLoad(res).then(()=>console.log("Done trying to sync activities")).catch((err)=>{
	let msg = `An error occured while loading activities:${err}`;
	console.log(msg);
	res.send(msg);
    });
   });

app.get('/deregister', function(req,res){
    console.log(req.query);
    let authorization_code = req.query.code;
    let request = stravaAPI.oauth.getToken(authorization_code)
    request.then((stravaRes) =>{
	let user = new stravaUser.stravaUser(stravaRes.athlete.id,stravaRes.access_token); 
	user.deregister().then(()=>{
	    console.log(`Done trying to deregister user with uid ${stravaRes.athlete.id}`);
	    res.redirect("deregistration_success")
	}).catch((err)=>{
	    let msg = `An error occured while loading activities:${err}`;
	    console.log(msg);
	    res.send(msg);
	});

    });

       
});

app.get('/allStreets',function(req,res){
    console.log("sending all streets");
    db.all("SELECT polyLine from polyLines").then(
	(dbRes,err)=>{
	    console.log(`Callback was called with result: err: ${err}, dbRes:${dbRes}`);
	    if(err){
		res.send(`An error occured ${JSON.stringify(err)}`);
		return;
	    }
	    let polyLineList = [];
	    for(let i =0; i<dbRes.length; i++){
		polyLineList.push(dbRes[i]["polyline"]); 
	    }
	    res.json(polyLineList);	
	}
    ); 
});

//Static webpages
app.use(express.static("public"))
const port = process.env.PORT || 8080;
app.listen(port);
console.log('Server started at http://localhost:' + port);

