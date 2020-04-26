var map; // La map avec tout ces composant
var osmLayer;
var listMarker = []; // contien tout les marker affiché sur la map
var dateFormat = "DD/MM/YYYY"; // Format de la date

/**
 * Initialise une map avec l'API leaflet
 */
function initialize() {
    map = L.map('map').setView([48.833, 2.333], 7); // En france

    osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });

    map.addLayer(osmLayer);

    getDataInFrench(moment().subtract(1, "days"));
    initDatePicker();
    getAllData();
}

/**
 * DatePicker
 * @param {*} date 
 */
function initDatePicker() {
    let dateMax = new Date();
    dateMax.setDate( dateMax.getDate() - 1 );
    $( "#datepicker" ).datepicker({
        minDate: new Date("2020-01-24"),
        maxDate: dateMax,
        onSelect: function(dateText, inst) {
            let date = moment(dateText);
            getDataInFrench(date);
        }
    });


}

/**
 * Récuère les données de l'api des cas par régions en france
 */
function getDataInFrench(date) {
    date.utcOffset(0);
    date.set({hour:0,minute:0,second:0,millisecond:0});
    date.toISOString();
    /**
     * Récupère les données par rapport 
     */
    $.get( "https://api.covid19api.com/country/France?from=" + date.utc().format() + "&to=" + date.add('1', 'days').utc().format(), function( data ) {
        dataMapReceive(data);
      });
}

/**
 * les data recu de L'api
 * @param {*} data 
 */
function dataMapReceive(data) {
    removeAllMarker();
    data.forEach(elem => {
        let lat = elem.Lat;
        let long = elem.Lon;
        let marker = L.marker([lat, long]).addTo(map);
        let html = getPopupMarker(elem);
        marker.bindPopup(html).openPopup();
        listMarker.push(marker);
    });
    // recentre en france 47.340132, 2.372405
    map.panTo([47.340132, 2.372405]);
}

/**
 * supprime tout les markers
 */
function removeAllMarker() {
    listMarker.forEach(marker => {
        map.removeLayer(marker);
    });
    listMarker = [];
}

/**
 * Return le html popup d'un marker avec ca data
 * @param {*} data 
 */
function getPopupMarker(data) {
    let date = moment(data.Date);
    let html = '<div class="popup-marker">';
    html += 'date : ' + date.format(dateFormat) + '<br>';
    html += 'cas confirmé : ' + data.Confirmed + '<br>';
    html += 'les morts : ' + data.Deaths + '<br>';
    html += 'les guéris : ' + data.Recovered + '<br>';
    html += '</div>';
    return html;
}

/**
 * Récupère le nombre de cas
 */
function getAllData() {
    $.get( "https://api.covid19api.com/total/dayone/country/france", function( data ) {
        firstGrph(data);
        secondeGrph(data);
        lastGraph(data);
      });
}

/**
 * Nombre de cas depuis le 24 janvier
 */
function firstGrph(data) {
    let arrayData = data.map(elem => elem.Confirmed);
    arrayData = passValueArrayByCriteria(arrayData, 10);
    let arrayLabels = data.map(elem => moment(elem.Date).format(dateFormat));
    arrayLabels = passValueArrayByCriteria(arrayLabels, 10);
    createSimpleGraph('firstChart', arrayLabels, arrayData, 'Nb cas comfirmés', 'line', '#41B6C8');
}

/**
 * Nombre de mort depuis le 24 janvier
 */
function secondeGrph(data) {
    let arrayData = data.map(elem => elem.Deaths);
    arrayData = passValueArrayByCriteria(arrayData, 10);
    let arrayLabels = data.map(elem => moment(elem.Date).format(dateFormat));
    arrayLabels = passValueArrayByCriteria(arrayLabels, 10);
    createSimpleGraph('secondeChart', arrayLabels, arrayData, 'Nb mort', 'bar', '#FF0000');
}

/**
 * pourcentage de mort, guéris et de cas sur 64 513 242 français depuis le 24 janvier
 * @param {*} data 
 */
function lastGraph(data) {
    const nbFr = 64513242;
    let cas = "" + (( 100*data[data.length -1].Confirmed ) / nbFr);
    let mort = "" + (( 100*data[data.length -1].Deaths ) / nbFr);
    let gueris = "" + (( 100*data[data.length -1].Recovered ) / nbFr);
    cas = cas.substring(0,5);
    mort = mort.substring(0,5);
    gueris = gueris.substring(0,5);
    var ctx = document.getElementById('lastChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['cas comfirmés','morts','guéris'],
            datasets: [{
                label: 'pourcentage(cas/mort/guéris)',
                data: [cas,mort,gueris],
                borderWidth: 1,
                backgroundColor: [
                    '#41B6C8',
                    '#FF0000',
                    '#36FF00'
                ],
            }]
        },
        options: {
            responsive : true
        }
    });
}

/**
 * Passe les valeurs dans un tableau exemple une valeur tout les 2
 * @param {*} nb 
 * @param {*} myArray 
 */
function passValueArrayByCriteria(myArray, nb) {
    let newArray = [];
    newArray.push(myArray[0]);
    let nba = 1;
    myArray.forEach(elem => {
        nba++;
        if(nba == nb) {
            nba = 0;
            newArray.push(elem);
        }
    });

    // si pas les derniere valeur
    if(!newArray.includes(myArray[myArray.length - 1])) {
        newArray.push(myArray[myArray.length - 1]);
    }

    return newArray;
}

/**
 * cree un simple graphe line
 * @param {*} id 
 * @param {*} labels 
 * @param {*} data 
 * @param {*} label 
 * @param {*} type 
 */
function createSimpleGraph(id, labels, data, label, type, color) {
    var ctx = document.getElementById(id).getContext('2d');
    var myChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                backgroundColor: color,
                data: data,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            responsive : true
        }
    });
}