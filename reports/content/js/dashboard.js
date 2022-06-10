/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 85.0, "KoPercent": 15.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.016666666666666666, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Homepage"], "isController": false}, {"data": [0.025, 500, 1500, "career"], "isController": false}, {"data": [0.025, 500, 1500, "about"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 60, 9, 15.0, 3051.4, 1376, 4557, 3060.5, 4244.099999999999, 4364.849999999999, 4557.0, 3.369272237196766, 585.0932625961647, 0.6163837881850853], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Homepage", 20, 8, 40.0, 3412.5, 1862, 4557, 3631.0, 4399.3, 4549.3, 4557.0, 1.437297879985627, 294.3024613726195, 0.17404779015450952], "isController": false}, {"data": ["career", 20, 1, 5.0, 2756.05, 1381, 4069, 2817.5, 3920.0, 4061.9, 4069.0, 1.4478065730418417, 236.18878775608079, 0.3082244462139858], "isController": false}, {"data": ["about", 20, 0, 0.0, 2985.6500000000005, 1376, 3897, 3017.5, 3808.9, 3892.7999999999997, 3897.0, 1.4483307987544354, 221.6967308458252, 0.31116482004489826], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 4,403 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,091 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,173 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,252 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,343 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,366 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,069 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,557 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 4,282 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, 11.11111111111111, 1.6666666666666667], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 60, 9, "The operation lasted too long: It took 4,403 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,091 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,173 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,252 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,343 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Homepage", 20, 8, "The operation lasted too long: It took 4,403 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,091 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,173 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,252 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, "The operation lasted too long: It took 4,343 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1], "isController": false}, {"data": ["career", 20, 1, "The operation lasted too long: It took 4,069 milliseconds, but should not have lasted longer than 4,000 milliseconds.", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
