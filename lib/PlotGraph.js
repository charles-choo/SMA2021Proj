// set global variables
const limit = 10000; // How many points can be on the graph before sliding occurs
const refreshInterval = 100; // Time between refresh intervals

function arrayAverage(arr) {
  //Find the sum
  var sum = 0;
  for (var i in arr) {
    sum += arr[i];
  }
  //Get the length of the array
  var numbersCnt = arr.length;
  //Return the average / mean.
  return sum / numbersCnt;
}

// set functions to retrieve
function getWaitTime(shopperType) {
  allWaitingTime = customerRecords
    .filter((customer) => customer.type == shopperType)
    .map(function (customer) {
      return customer.timeInSystem - customer.shoppingTime;
    });
  averageWaitingTime = arrayAverage(allWaitingTime);

  return averageWaitingTime;
}
function getTimeInSystem(shopperType) {
  allTimeInSystem = customerRecords
    .filter((customer) => customer.type == shopperType)
    .map(function (customer) {
      return customer.timeInSystem;
    });
  averageTimeInSystem = arrayAverage(allTimeInSystem);

  return averageTimeInSystem;
}

// set chart layout
const layout1 = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  xaxis: { title: "Time" },
  yaxis: { title: "Average Wait Time" },
};

const layout2 = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  xaxis: { title: "Time" },
  yaxis: { title: "Average Time in System" },
};

// plot all charts
Plotly.plot(
  "chart1",
  [
    {
      name: "Trolley Shopper",
      y: [getWaitTime("trolleyShopper")],
      mode: "lines",
      line: {
        color: "rgb(255,0,0)",
        width: 3,
      },
    },
    {
      name: "Basket Shopper",
      y: [getWaitTime("basketShopper")],
      mode: "lines",
      line: {
        color: "rgb(0,255,0)",
        width: 3,
      },
    },
    {
      name: "Scan&Go Shopper",
      y: [getWaitTime("scanAndGoShopper")],
      mode: "lines",
      line: {
        color: "rgb(0,0,255)",
        width: 3,
      },
    },
  ],
  layout1
);

Plotly.plot(
  "chart2",
  [
    {
      name: "Trolley Shopper",
      y: [getTimeInSystem("trolleyShopper")],
      mode: "lines",
      line: {
        color: "rgb(255,0,0)",
        width: 3,
      },
    },
    {
      name: "Basket Shopper",
      y: [getTimeInSystem("basketShopper")],
      mode: "lines",
      line: {
        color: "rgb(0,255,0)",
        width: 3,
      },
    },
    {
      name: "Scan&Go Shopper",
      y: [getTimeInSystem("scanAndGoShopper")],
      mode: "lines",
      line: {
        color: "rgb(0,0,255)",
        width: 3,
      },
    },
  ],
  layout2
);

// set refresh interval and graph limit
var cnt = 0;
setInterval(function () {
  if (isRunning == true) {
    Plotly.extendTraces(
      "chart1",
      {
        y: [
          [getWaitTime("trolleyShopper")],
          [getWaitTime("basketShopper")],
          [getWaitTime("scanAndGoShopper")],
        ],
      },
      [0, 1, 2]
    );
    cnt++;
    if (cnt > limit) {
      Plotly.relayout("chart1", {
        xaxis: {
          range: [cnt - limit, cnt],
        },
      });
    }
    Plotly.extendTraces(
      "chart2",
      {
        y: [
          [getTimeInSystem("trolleyShopper")],
          [getTimeInSystem("basketShopper")],
          [getTimeInSystem("scanAndGoShopper")],
        ],
      },
      [0, 1, 2]
    );
    if (cnt > limit) {
      Plotly.relayout("chart2", {
        xaxis: {
          range: [cnt - limit, cnt],
        },
      });
    }
  }
}, refreshInterval);
