let ws, wsB;
function addEvents() {
    document.getElementById('taskBtn').addEventListener('click', addComment);

    let elementsRemove = document.querySelectorAll(".remove");
    elementsRemove.forEach(el => el.addEventListener('click', event => {
        deleteTask(event);
    }));

    let elementsChange = document.querySelectorAll(".checkbox");
    elementsChange.forEach(el => el.addEventListener('click', event => {
        changeState(event);
    }));
}

let weatherContent;
let weatherDetContent;

window.onload = function () {
    addEvents();
    setInterval(calctime, 1000 * 1);
    setInterval(refreshMaster, 1000 * 15);
    setInterval(refreshCalendar, 1000 * 60 * 60);
    setInterval(refreshCharts, 1000 * 60 * 5);
    setInterval(refreshWeather, 1000 * 60 * 15);
    weatherContent = document.getElementById("weather").innerHTML;
    weatherDetContent = document.getElementById("weatherDetailed").innerHTML;

    // let client_id = Date.now()
    // let prefix = "";
    // if (`{{ getenv("DOMAIN") }}`=="localhost")
    //     prefix = "ws";
    // else
    //     prefix = "wss";
    // ws = new WebSocket(`${prefix}://homescreen.{{ getenv("DOMAIN") }}/tasks/ws/${client_id}`);
    // ws.onopen = function(event){
    //     addTasks(event);
    //  };
    // ws.onmessage = function(event){
    //     addTasks(event);
    //  };
    // wsB = new WebSocket(`${prefix}://homescreen.{{ getenv("DOMAIN") }}/buses/ws/${client_id}`);
    // wsB.onmessage = function (event) {
    //     addBuses(event);
    //  }
}

function completedTask(el){
    return `<li class="completed"><div class="form-check"><label class="form-check-label"><input id="a${el.id}" class="" type="">${el.text}<i class="input-helper"></i></label></div><i id="${el.id}" class="remove mdi mdi-close-circle-outline"</i></li>`
}
function uncompletedTask(el){
    return `<li><div class="form-check"><label class="form-check-label"><input id="a${el.id}" class="" type="">${el.text}<i class="input-helper"></i></label></div><i id="${el.id}" class="remove mdi mdi-close-circle-outline"></i></li>`
}

function addTasks(taskList){
    let htmlToAdd = "";
    let tasksArr = [];
    for (const el of taskList) {
        tasksArr.push(el);
    }
    tasksArr.sort(function (a, b) {
        return b.id - a.id;
    })
    for (let i=0; i<tasksArr.length; i++){
        let el = tasksArr[i];
        if (el.finished)
            htmlToAdd += completedTask(el);
        else
            htmlToAdd += uncompletedTask(el);
    }
    document.getElementsByClassName('todo-list')[0].innerHTML = htmlToAdd;
    addEvents();
}

function addComment(event) {
    console.log("addcomment");
    event.preventDefault();
    let text = document.getElementById('taskText').value;
    const data = {"text": text};
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        body: JSON.stringify(data),
        method: "POST"
    };
    fetch("tasks/add", params)
        .then(res => triggerUpdateTasks());
    document.getElementById('taskText').value = "";
}

function deleteTask(event) {
    const task_id = event.target.id;
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        method: "DELETE"
    };
    fetch("tasks/delete/"+task_id, params)
        .then(res => triggerUpdateTasks());
}

function changeState(event) {
    const task_id = event.target.id.replace("a", "");
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        method: "PUT"
    };
    let is_finished = true;
    if (event.target.hasAttribute("checked")) {
        is_finished = false;
    }

    fetch("tasks/change_state/"+task_id+"?is_finished="+is_finished.toString(), params)
        .then(res => triggerUpdateTasks());
}

function triggerUpdateTasks() {
    ws.send(JSON.stringify({"command": "trigger"}))
}

function addBuses(data) {
    let toDefense = data['to_defense'];
    let toRER = Array.from(data['to_rer']);
    let htmlDefense = arrivalsBus(toDefense);
    let htmlRER = arrivalsBus(toRER);

    document.getElementById("arrivalsDefense").innerHTML = htmlDefense;
    document.getElementById("arrivalsRER").innerHTML = htmlRER;
}
function arrivalsBus(arr) {
    let html = "";
    for (let i=0; i<arr.length; i++) {
        let el = arr[i];
        let badgeClass = "";
        if (el['route'] == '259')
            badgeClass = 'badge-primary';
        else if (el['route'] == '258')
            badgeClass = 'badge-danger';
        else
            badgeClass = 'badge-secondary';

        let etd = new Date(el['etd']);
        let dateNow = new Date();
        if ((dateNow - etd) > 0)
            html += ''
        else {
            html += `
            <div class="col-1">
                <span class="badge ${badgeClass}">${el['route']}</span>
            </div>
            <div class="col-7">
                <p>${el['destination']}</p>
            </div>
            <div class="col-2" backupTime="${etd.toISOString()}">
                <p>${etd.toLocaleTimeString("ru-RU")}</p>
            </div>
            <div class="col-2 timeRemaining">
                <p></p>
            </div>
        `;
        }
    }
    return html;
}

function calctime() {
    Array.from(document.getElementsByClassName("timeRemaining")).forEach(function(el) {
        let dateNow = new Date();
        let etd = new Date(el.previousElementSibling.getAttribute("backupTime"));
        let rem = etd - dateNow;
        rem = Math.round(rem / 1000);
        let html = "";
        if (rem < 3600)
            if (rem < 0)
                html += 'Missed';
            else
                html += new Date(rem * 1000).toISOString().substring(14, 19)
        else
            html += new Date(rem * 1000).toISOString().substring(11, 16)

        el.children[0].innerHTML = html;
    });
}

function refreshMaster() {
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        method: "GET"
    };
    fetch("/refresh", params)
        .then((response) => response.json())
        .then((data) => {
            if (data['buses']){
                addBuses(data['buses']);
            }
            if (data['tasks']){
                addTasks(data['tasks']);
            }
        })
}

function refreshCalendar() {
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        method: "GET"
    };
    fetch("/calendar", params)
        .then((response) => response.text())
        .then((data) => {
            document.getElementById('calendar').innerHTML = data;
        })
}

function refreshCharts() {
    const params = {
        headers: {"content-type": "application/json; charset=UTF-8"},
        method: "GET"
    };
    fetch("/ambiance/farmdata", params)
        .then((response) => response.json())
        .then((data) => {
            let tracesTemp = [];
            let tracesSoil = [];
            let tracesLevel = [];
            let time = [];
            let temperature = [];
            let soil = [];
            let level = [];
            for (let points of data) {
                let sensorsData = points['data'];

                for (let point of sensorsData) {
                    let timePoint = new Date(point['time']);
                    time.push(timePoint);
                    temperature.push(point['temperature']);
                    soil.push(point['soil_moisture']);
                    level.push(point['water_level']);
                }

                // Filling traces
                let tempmax = Math.max(...temperature);
                let tempmin = Math.min(...temperature);
                let soilmax = Math.max(...soil);
                let soilmin = Math.min(...soil);
                let levelmax = Math.max(...level);
                let levelmin = Math.min(...level);

                let tempdiff = tempmax - tempmin;
                let soildiff = soilmax - soilmin;
                let leveldiff = levelmax - levelmin;
                const diffMultiplier = 0.1;

                tracesTemp.push({
                    x: time,
                    y: temperature,
                    mode: 'lines',
                    line: {color: 'rgba(255,163,27,0.2)'},
                    fill: 'tozeroy',
                    fillcolor: 'rgba(255,163,27,0.2)'
                });

                tracesTemp.push({
                    x: [time[0]],
                    y: [tempmax + tempdiff * diffMultiplier],
                    type: 'scatter',
                    mode: 'markers+text',
                    marker: {
                        size: 0,
                        color: 'rgba(0,0,0,0)'
                    },
                    textfont: {
                        size: 15,
                        color: 'rgb(253,162,27)'
                    },
                    text: ['<b>'+(Math.round(temperature[temperature.length - 1] * 10) / 10).toString() + '°C</b>'],
                    textposition: 'right bottom'
                });

                tracesSoil.push({
                    x: time,
                    y: soil,
                    mode: 'lines',
                    line: {color: 'rgba(24,55,255,0.2)'},
                    fill: 'tozeroy',
                    fillcolor: 'rgba(24,55,255,0.2)'
                });

                tracesSoil.push({
                    x: [time[0]],
                    y: [soilmax + soildiff * diffMultiplier],
                    type: 'scatter',
                    mode: 'markers+text',
                    marker: {
                        size: 0,
                        color: 'rgba(0,0,0,0)'
                    },
                    textfont: {
                        size: 15,
                        color: 'rgb(65,92,255)'
                    },
                    text: ['<b>'+Math.round(soil[soil.length - 1]).toString() + '%</b>'],
                    textposition: 'bottom right'
                });

                tracesLevel.push({
                    x: time,
                    y: level,
                    mode: 'lines',
                    line: {color: 'rgba(255,255,255,0.2)'},
                    fill: 'tozeroy',
                    fillcolor: 'rgba(255,255,255,0.2)'
                });

                tracesLevel.push({
                    x: [time[0]],
                    y: [levelmax],
                    type: 'scatter',
                    mode: 'markers+text',
                    marker: {
                        size: 0,
                        color: 'rgba(0,0,0,0)'
                    },
                    text: ['<b>'+(Math.round(level[level.length - 1] * 10) / 10).toString() + ' cm</b>'],
                    textfont: {
                        size: 15,
                        color: '#acacac'
                    },
                    textposition: 'right'
                });

                // Configuring traces layout
                let layoutBase = {
                    margin: {
                        t: 10,
                        l: 25,
                        b: 15,
                        r: 10
                    },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    showlegend: false
                };
                let layoutTemp = {...layoutBase, ...{
                        yaxis: {
                            range: [tempmin - tempdiff*diffMultiplier, tempmax + tempdiff*diffMultiplier],
                            showgrid: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)'
                        },
                        xaxis: {
                            showgrid: false,
                            showticklabels: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)'
                        }
                    }
                };
                let layoutSoil = {...layoutBase, ...{
                        yaxis: {
                            range: [soilmin - soildiff*diffMultiplier, soilmax + soildiff*diffMultiplier],
                            showgrid: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)'
                        },
                        xaxis: {
                            showgrid: false,
                            showticklabels: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)'
                        }
                    }
                };
                let layoutLevel = {...layoutBase, ...{
                        yaxis: {
                            range: [levelmin - leveldiff*diffMultiplier, levelmax + leveldiff*diffMultiplier],
                            showgrid: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)'
                        },
                        xaxis: {
                            showgrid: false,
                            color: '#ffffff',
                            zerolinecolor: 'rgba(0,0,0,0)',
                            tickformat: '%Hh',
                            tickmode: "linear",
                            tick0: time[0],
                            dtick: 1000 * 60 * 60 * 3 // 3h
                        }
                    }
                };
                let config = {
                    staticPlot: true,
                    showlegend: false,
                    displayModeBar: false,
                    displaylogo: false,
                }

                // Plotting
                Plotly.newPlot('farmTemperature', tracesTemp, layoutTemp, config);
                Plotly.newPlot('farmSoil', tracesSoil, layoutSoil, config);
                Plotly.newPlot('farmLevel', tracesLevel, layoutLevel, config);
            }
        });


    fetch("/ambiance", params)
        .then((response) => response.json())
        .then((data) => {
            let tracesTemp = [];
            let tracesRelHum = [];
            let tracesAbsHum = [];
            let time = [];
            let temperature = [];
            let rel_humidity = [];
            let abs_humidity = [];
            for (let points of data) {
                let roomName = points['room_name'];
                if (roomName != 'room1')
                    continue;
                let sensorsData = points['data'];

                for (let point of sensorsData) {
                    let timePoint = new Date(point['time']);
                    time.push(timePoint);
                    let temp = point['temperature'];
                    temperature.push(temp);
                    if (point['rel_humidity']) {
                        let rel_h = point['rel_humidity'];
                        rel_humidity.push(rel_h);
                        abs_humidity.push(6.112 * Math.exp(17.67 * temp / (temp + 243.5)) * rel_h * 2.1674 / (273.15 + temp));
                    }
                }
            }
            // Filling traces
            let tempmax = Math.max(...temperature);
            let tempmin = Math.min(...temperature);
            let hummax = Math.max(...rel_humidity);
            let hummin = Math.min(...rel_humidity);
            let abshummax = Math.max(...abs_humidity);
            let abshummin = Math.min(...abs_humidity);

            let tempdiff = tempmax - tempmin;
            let humdiff = hummax - hummin;
            let abshumdiff = abshummax - abshummin;
            const diffMultiplier = 0.1;

            tracesTemp.push({
                x: time,
                y: temperature,
                mode: 'lines',
                line: {color: 'rgba(255,163,27,0.2)'},
                fill: 'tozeroy',
                fillcolor: 'rgba(255,163,27,0.2)'
            });
            tracesTemp.push({
                x: [time[0]],
                y: [tempmax + tempdiff * diffMultiplier],
                type: 'scatter',
                mode: 'markers+text',
                marker: {
                    size: 0,
                    color: 'rgba(0,0,0,0)'
                },
                textfont: {
                    size: 15,
                    color: 'rgb(253,162,27)'
                },
                text: ['<b>'+(Math.round(temperature[temperature.length - 1] * 10) / 10).toString() + '°C</b>'],
                textposition: 'right bottom'
            });

            tracesRelHum.push({
                x: time,
                y: rel_humidity,
                mode: 'lines',
                line: {color: 'rgba(24,55,255,0.2)'},
                fill: 'tozeroy',
                fillcolor: 'rgba(24,55,255,0.2)'
            });
            tracesRelHum.push({
                x: [time[0]],
                y: [hummax + humdiff * diffMultiplier],
                type: 'scatter',
                mode: 'markers+text',
                marker: {
                    size: 0,
                    color: 'rgba(0,0,0,0)'
                },
                textfont: {
                    size: 15,
                    color: 'rgb(65,92,255)'
                },
                text: ['<b>'+Math.round(rel_humidity[rel_humidity.length - 1]).toString() + '%</b>'],
                textposition: 'bottom right'
            });

            tracesAbsHum.push({
                x: time,
                y: abs_humidity,
                mode: 'lines',
                line: {color: 'rgba(255,255,255,0.2)'},
                fill: 'tozeroy',
                fillcolor: 'rgba(255,255,255,0.2)'
            });
            tracesAbsHum.push({
                x: [time[0]],
                y: [abshummax],
                type: 'scatter',
                mode: 'markers+text',
                marker: {
                    size: 0,
                    color: 'rgba(0,0,0,0)'
                },
                text: ['<b>'+(Math.round(abs_humidity[abs_humidity.length - 1] * 10) / 10).toString() + ' g/m3</b>'],
                textfont: {
                    size: 15,
                    color: '#acacac'
                },
                textposition: 'right'
            });

            // Configuring traces layout
            let layoutBase = {
                margin: {
                    t: 10,
                    l: 25,
                    b: 15,
                    r: 10
                },
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                showlegend: false
            };
            let layoutTemp = {...layoutBase, ...{
                    yaxis: {
                        range: [tempmin - tempdiff*diffMultiplier, tempmax + tempdiff*diffMultiplier],
                        showgrid: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)'
                    },
                    xaxis: {
                        showgrid: false,
                        showticklabels: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)'
                    }
                }
            };
            let layoutHum = {...layoutBase, ...{
                    yaxis: {
                        range: [hummin - humdiff*diffMultiplier, hummax + humdiff*diffMultiplier],
                        showgrid: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)'
                    },
                    xaxis: {
                        showgrid: false,
                        showticklabels: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)'
                    }
                }
            };
            let layoutAbsHum = {...layoutBase, ...{
                    yaxis: {
                        range: [abshummin - abshumdiff*diffMultiplier, abshummax + abshumdiff*diffMultiplier],
                        showgrid: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)'
                    },
                    xaxis: {
                        showgrid: false,
                        color: '#ffffff',
                        zerolinecolor: 'rgba(0,0,0,0)',
                        tickformat: '%Hh',
                        tickmode: "linear",
                        tick0: time[0],
                        dtick: 1000 * 60 * 60 * 3 // 3h
                    }
                }
            };
            let config = {
                staticPlot: true,
                showlegend: false,
                displayModeBar: false,
                displaylogo: false,
            }

            // Plotting
            Plotly.newPlot('homeTemperature', tracesTemp, layoutTemp, config);
            Plotly.newPlot('homeHumidity', tracesRelHum, layoutHum, config);
            Plotly.newPlot('homeAbsHumidity', tracesAbsHum, layoutAbsHum, config);
        })
}



function refreshWeather() {
    document.getElementById("weather").innerHTML = weatherContent;
    document.getElementById("weatherDetailed").innerHTML = weatherDetContent;
    updateWidget('ww_b98dfdb5c11fa', 0);
    updateWidget('ww_8de6bcd2bdab1', 0);
}

function requestGet(url, callback, id, gen) {
    var request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            callback(id, request.responseText, gen)
        }
    };
    request.open('GET', url);
    request.send()
}
function requestPost(url, callback, params, id) {
    var request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            callback(request.responseText, id)
        }
    };
    request.open('POST', url, !0);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.send(params)
}
function getDataFromApi(id, i, gen) {
    var v = document.getElementById(id).getAttribute("v");
    var a = document.getElementById(id).getAttribute("a");
    var l = document.getElementById(id).getAttribute("loc");
    var u = document.getElementById(id + '_u').getAttribute("href") + '|||' + document.getElementById(id + '_u').innerHTML;
    if (gen == 1) {
        var ub = ''
    } else {
        var ub = document.getElementById(id).innerHTML
    }
    var i = i;
    var g = gen;
    var params = 'v=' + v + '&a=' + a + '&l=' + l + '&u=' + u + '&ub=' + ub + '&i=' + i + '&g=' + g + '&id=' + id;
    requestPost('https://app1.weatherwidget.org/data/', updateOnPage, params, id)
}
function collectData(id, gen) {
    if (document.getElementById(id).getAttribute("loc") === 'auto') {
        requestGet('https://api.ipify.org/', getDataFromApi, id, gen)
    } else {
        getDataFromApi(id, !1, gen)
    }
}
function updateOnPage(data, id) {
    if (typeof JSON.parse === "undefined") {
        data = JSON.decode(data)
    } else {
        data = JSON.parse(data)
    }
    if (data.hasOwnProperty("a")) {
        if (data.a.hasOwnProperty("html")) {
            document.getElementById(id).innerHTML = data.a.html
        }
        if (data.a.hasOwnProperty("style")) {
            document.getElementById(id).style.cssText = data.a.style
        }
        if (data.a.hasOwnProperty("jsCode")) {
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.async = !1;
            script.text = data.a.jsCode;
            document.getElementsByTagName('head')[0].appendChild(script)
        }
        if (data.a.hasOwnProperty("ub")) {
            document.getElementById(id + '_info_box_inner').innerHTML = data.a.ub;
            updateInfobox(id, data.a.ub);
            loadingToggle(id, 2)
        }
    } else if (data.hasOwnProperty("error_code")) {
        document.getElementById(id).innerHTML = '';
        console.log('weatherwidget.org / Error: ' + data.error_msg + ' (Error code ' + data.error_code + ')')
    }
}
function updateWidget(id, gen) {
    if (gen === 1) {
        loadingToggle(id, 1)
    }
    collectData(id, gen)
}

setTimeout(refreshCharts, 5000);
setTimeout(refreshWeather, 6000)