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
function getData1(shopperType) {
  allWaitingTime = customerRecords
    .filter((customer) => customer.type == shopperType)
    .map(function (customer) {
      return customer.timeInSystem - customer.shoppingTime;
    });
  averageWaitingTime = arrayAverage(allWaitingTime);

  return averageWaitingTime;
}
function getData2() {
  allTimeInSystem = customerRecords.map(function (customer) {
    return customer.timeInSystem - customer.shoppingTime;
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
  yaxis: { title: "R0" },
};

// plot all charts
Plotly.plot(
  "chart1",
  [
    {
      y: [getData1("basketShopper")],
      mode: "lines",
      line: {
        color: "rgb(255,0,255)",
        width: 3,
      },
    },
    {
      y: [getData1("trolleyShopper")],
      mode: "lines",
      line: {
        color: "rgb(255,0,0)",
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
      y: [getData2()],
      mode: "lines",
      line: {
        color: "rgb(255,0,0)",
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
    Plotly.extendTraces("chart1", { y: [[getData1()]] }, [0]);
    cnt++;
    if (cnt > limit) {
      Plotly.relayout("chart1", {
        xaxis: {
          range: [cnt - limit, cnt],
        },
      });
    }
    Plotly.extendTraces("chart2", { y: [[getData2()]] }, [0]);
    if (cnt > limit) {
      Plotly.relayout("chart2", {
        xaxis: {
          range: [cnt - limit, cnt],
        },
      });
    }
  }
}, refreshInterval);
