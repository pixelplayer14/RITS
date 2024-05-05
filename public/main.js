var map = L.map('map').setView([52.2391482,6.8565761],13); 
function buildMap(){
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}
buildMap();

fetch("./allStreets",{headers:{"Content-Type":"application/json"}})
    .then(data=>{return data.json()})
    .then(res=>{
	for(let i=0; i<res.length; i++){
	    L.polyline(L.PolylineUtil.decode(res[i]),1).addTo(map);
	}
    })
