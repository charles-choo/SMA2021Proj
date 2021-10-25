var WINDOWBORDERSIZE = 10;
var HUGE = 999999; //Sometimes useful when testing for big or small numbers
var animationDelay = 200; //controls simulation and transition speed
var isRunning = false; // used in simStep and toggleSimStep
var surface; // Set in the redrawWindow function. It is the D3 selection of the svg drawing surface
var simTimer; // Set in the initialization function

//The drawing surface will be divided into logical cells
var maxCols = 40;
var cellWidth; //cellWidth is calculated in the redrawWindow function
var cellHeight; //cellHeight is calculated in the redrawWindow function

//You are free to change images to suit your purpose. These images came from icons-land.com.
// The copyright rules for icons-land.com require a backlink on any page where they appear.
// See the credits element on the html page for an example of how to comply with this rule.
const basketShopper = "images/Basket_shopper.svg";
const trolleyShopper = "images/Trolley_shopper.svg";
const urlregularCheckout = "images/regularcheckout_counter.svg";
const urlSelfCheckout = "images/selfcheckout_counter.svg";

var numberOfRegularCounters = 3;
var regularCounterStartRow = 2;
var regularCounterStartCol = 23;

var numberOfSelfCheckoutCounters = 2;
var selfCheckoutCounterStartRow = 11;
var selfCheckoutCounterStartCol = 23;

var queueStartRow = 5;
var queueStartCol = 14;

//a customer enters the hospital SHOPPING; he or she then is QUEUEING to be treated by a regularCheckout;
// then INTREATMENT with the regularCheckout; then TREATED;
// When the customer is DISCHARGED he or she leaves the clinic immediately at that point.
const SHOPPING = 0;
const WAITING = 1;
const TRANSACTION = 2;
const LEAVING = 3;
const EXITED = 4;

// The regularCheckout can be either BUSY treating a customer, or IDLE, waiting for a customer
const IDLE = 0;
const BUSY = 1;

// There are two types of serviceCounters in our system: regularCheckouts and receptionists
//const regularCheckout = 0;

// customers is a dynamic list, initially empty
var customers = [];
// serviceCounters is a static list, populated with a receptionist and a regularCheckout
var serviceCounters = [];

for (i = 0; i < numberOfRegularCounters; i++) {
  serviceCounters.push({
    type: regularCheckout,
    label: "Regular Checkout",
    location: {
      row: regularCounterStartRow + 2 * i,
      col: regularCounterStartCol,
    },
    state: IDLE,
  });
}
for (i = 0; i < numberOfSelfCheckoutCounters; i++) {
  serviceCounters.push({
    type: selfCheckout,
    label: "Self Checkout",
    location: {
      row: selfCheckoutCounterStartRow + 2 * i,
      col: selfCheckoutCounterStartCol,
    },
    state: IDLE,
  });
}

var regularCheckout = serviceCounters[0]; // the regularCheckout is the first element of the serviceCounters list.
var selfCheckout = serviceCounters[5];
// We can section our screen into different areas. In this model, the waiting area and the TRANSACTION area are separate.
var areas = [
  {
    label: "Shopping Area",
    startRow: 2,
    numRows: 16,
    startCol: 2,
    numCols: 8,
    color: "pink",
  },
  {
    label: "regular checkout waiting area",
    startRow: 2,
    numRows: 8,
    startCol: 11,
    numCols: 10,
    color: "yellow",
  },
  {
    label: "self checkout waiting area",
    startRow: 11,
    numRows: 8,
    startCol: 11,
    numCols: 10,
    color: "green",
  },
];

var shoppingArea = areas[0]; // the waiting room is the first element of the areas array
var regularCheckoutArea = areas[1];
var selfCheckoutArea = areas[2];

var currentTime = 0;
var statistics = [
  {
    name: "",
    location: {
      row: regularCounterStartRow + 3,
      col: regularCounterStartCol - 4,
    },
    cumulativeValue: 0,
    count: 0,
  },
  {
    name: "",
    location: {
      row: regularCounterStartRow + 4,
      col: regularCounterStartCol - 4,
    },
    cumulativeValue: 0,
    count: 0,
  },
];

// The probability of a customer arrival needs to be less than the probability of a departure, else an infinite queue will build.
// You also need to allow travel time for customers to move from their seat in the waiting room to get close to the regularCheckout.
// So don't set probDeparture too close to probArrival.
var probArrival = 0.25;
var probShopping = 0.1;
var probDeparture = 1;

// We can have different types of customers (A and B) according to a probability, probBasketShopper.
// This version of the simulation makes no difference between A and B customers except for the display image
// Later assignments can build on this basic structure.
var probBasketShopper = 0;

// To manage the queues, we need to keep track of customerIDs.
var nextCustomerID = 0; // increment this and assign it to the next admitted customer of type B
var nextRegularServicedCustomerID = 0; //this is the id of the next customer of type B to be treated by the regularCheckout
var nextSelfCheckoutServicedCustomerID = 0;
// This next function is executed when the script is loaded. It contains the page initialization code.
(function () {
  // Your page initialization code goes here
  // All elements of the DOM will be available here
  window.addEventListener("resize", redrawWindow); //Redraw whenever the window is resized
  simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
  redrawWindow();
})();

// We need a function to start and pause the the simulation.
function toggleSimStep() {
  //this function is called by a click event on the html page.
  // Search BasicAgentModel.html to find where it is called.
  isRunning = !isRunning;
  console.log("isRunning: " + isRunning);
}

function redrawWindow() {
  isRunning = false; // used by simStep
  window.clearInterval(simTimer); // clear the Timer
  animationDelay = 550 - document.getElementById("slider1").value;
  simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds

  // Re-initialize simulation variables

  nextCustomerID = 0; // increment this and assign it to the next entering customer of type B
  nextRegularServicedCustomerID = 1; //this is the id of the next customer of type B to be treated by the regularCheckout
  currentTime = 0;
  regularCheckout.state = IDLE;
  statistics[0].cumulativeValue = 0;
  statistics[0].count = 0;
  statistics[1].cumulativeValue = 0;
  statistics[1].count = 0;
  customers = [];

  //resize the drawing surface; remove all its contents;
  var drawsurface = document.getElementById("surface");
  var creditselement = document.getElementById("credits");
  var w = window.innerWidth;
  var h = window.innerHeight;
  var surfaceWidth = w - 3 * WINDOWBORDERSIZE;
  var surfaceHeight = h - creditselement.offsetHeight - 3 * WINDOWBORDERSIZE;

  drawsurface.style.width = surfaceWidth + "px";
  drawsurface.style.height = surfaceHeight + "px";
  drawsurface.style.left = WINDOWBORDERSIZE / 2 + "px";
  drawsurface.style.top = WINDOWBORDERSIZE / 2 + "px";
  drawsurface.style.border = "thick solid #0000FF"; //The border is mainly for debugging; okay to remove it
  drawsurface.innerHTML = ""; //This empties the contents of the drawing surface, like jQuery erase().

  // Compute the cellWidth and cellHeight, given the size of the drawing surface
  numCols = maxCols;
  cellWidth = surfaceWidth / numCols;
  numRows = Math.ceil(surfaceHeight / cellWidth);
  cellHeight = surfaceHeight / numRows;

  // In other functions we will access the drawing surface using the d3 library.
  //Here we set the global variable, surface, equal to the d3 selection of the drawing surface
  surface = d3.select("#surface");
  surface.selectAll("*").remove(); // we added this because setting the inner html to blank may not remove all svg elements
  surface.style("font-size", "100%");
  // rebuild contents of the drawing surface
  updateSurface();
}

// The window is resizable, so we need to translate row and column coordinates into screen coordinates x and y
function getLocationCell(location) {
  var row = location.row;
  var col = location.col;
  var x = (col - 1) * cellWidth; //cellWidth is set in the redrawWindow function
  var y = (row - 1) * cellHeight; //cellHeight is set in the redrawWindow function
  return { x: x, y: y };
}

function updateSurface() {
  // This function is used to create or update most of the svg elements on the drawing surface.
  // See the function removeDynamicAgents() for how we remove svg elements

  //Select all svg elements of class "customer" and map it to the data list called customers
  var allcustomers = surface.selectAll(".customer").data(customers);

  // If the list of svg elements is longer than the data list, the excess elements are in the .exit() list
  // Excess elements need to be removed:
  allcustomers.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
  // (This remove function is needed when we resize the window and re-initialize the customers array)

  // If the list of svg elements is shorter than the data list, the new elements are in the .enter() list.
  // The first time this is called, all the elements of data will be in the .enter() list.
  // Create an svg group ("g") for each new entry in the data list; give it class "customer"
  var newcustomers = allcustomers.enter().append("g").attr("class", "customer");
  //Append an image element to each new customer svg group, position it according to the location data, and size it to fill a cell
  // Also note that we can choose a different image to represent the customer based on the customer type
  newcustomers
    .append("svg:image")
    .attr("x", function (d) {
      var cell = getLocationCell(d.location);
      return cell.x + "px";
    })
    .attr("y", function (d) {
      var cell = getLocationCell(d.location);
      return cell.y + "px";
    })
    .attr("width", Math.min(cellWidth, cellHeight) + "px")
    .attr("height", Math.min(cellWidth, cellHeight) + "px")
    .attr("xlink:href", function (d) {
      if (d.type == "basketShopper") return basketShopper;
      else return trolleyShopper;
    });

  // For the existing customers, we want to update their location on the screen
  // but we would like to do it with a smooth transition from their previous position.
  // D3 provides a very nice transition function allowing us to animate transformations of our svg elements.

  //First, we select the image elements in the allcustomers list
  var images = allcustomers.selectAll("image");
  // Next we define a transition for each of these image elements.
  // Note that we only need to update the attributes of the image element which change
  images
    .transition()
    .attr("x", function (d) {
      var cell = getLocationCell(d.location);
      return cell.x + "px";
    })
    .attr("y", function (d) {
      var cell = getLocationCell(d.location);
      return cell.y + "px";
    })
    .duration(animationDelay)
    .ease("linear"); // This specifies the speed and type of transition we want.

  // customers will leave the clinic when they have been discharged.
  // That will be handled by a different function: removeDynamicAgents

  //Select all svg elements of class "serviceCounter" and map it to the data list called serviceCounters
  var allserviceCounters = surface
    .selectAll(".serviceCounter")
    .data(serviceCounters);
  //This is not a dynamic class of agents so we only need to set the svg elements for the entering data elements.
  // We don't need to worry about updating these agents or removing them
  // Create an svg group ("g") for each new entry in the data list; give it class "serviceCounter"
  var newserviceCounters = allserviceCounters
    .enter()
    .append("g")
    .attr("class", "serviceCounter");
  newserviceCounters
    .append("svg:image")
    .attr("x", function (d) {
      var cell = getLocationCell(d.location);
      return cell.x + "px";
    })
    .attr("y", function (d) {
      var cell = getLocationCell(d.location);
      return cell.y + "px";
    })
    .attr("width", Math.min(cellWidth, cellHeight) + "px")
    .attr("height", Math.min(cellWidth, cellHeight) + "px")
    .attr("xlink:href", function (d) {
      if (d.label == "Regular Checkout") return urlregularCheckout;
      else return urlSelfCheckout;
    });

  // It would be nice to label the serviceCounters, so we add a text element to each new caregiver group
  newserviceCounters
    .append("text")
    .attr("x", function (d) {
      var cell = getLocationCell(d.location);
      return cell.x + cellWidth + "px";
    })
    .attr("y", function (d) {
      var cell = getLocationCell(d.location);
      return cell.y + cellHeight / 2 + "px";
    })
    .attr("dy", ".35em")
    .text(function (d) {
      return d.label;
    });

  // The simulation should serve some purpose
  // so we will compute and display the average length of stay of each customer type.
  // We created the array "statistics" for this purpose.
  // Here we will create a group for each element of the statistics array (two elements)
  var allstatistics = surface.selectAll(".statistics").data(statistics);
  var newstatistics = allstatistics
    .enter()
    .append("g")
    .attr("class", "statistics");
  // For each new statistic group created we append a text label
  newstatistics
    .append("text")
    .attr("x", function (d) {
      var cell = getLocationCell(d.location);
      return cell.x + cellWidth + "px";
    })
    .attr("y", function (d) {
      var cell = getLocationCell(d.location);
      return cell.y + cellHeight / 2 + "px";
    })
    .attr("dy", ".35em")
    .text("");

  // The data in the statistics array are always being updated.
  // So, here we update the text in the labels with the updated information.
  allstatistics.selectAll("text").text(function (d) {
    var avgLengthOfStay = d.cumulativeValue / Math.max(1, d.count); // cumulativeValue and count for each statistic are always changing
    return d.name + avgLengthOfStay.toFixed(1);
  }); //The toFixed() function sets the number of decimal places to display

  // Finally, we would like to draw boxes around the different areas of our system. We can use d3 to do that too.
  var allareas = surface.selectAll(".areas").data(areas);
  var newareas = allareas.enter().append("g").attr("class", "areas");
  // For each new area, append a rectangle to the group
  newareas
    .append("rect")
    .attr("x", function (d) {
      return (d.startCol - 1) * cellWidth;
    })
    .attr("y", function (d) {
      return (d.startRow - 1) * cellHeight;
    })
    .attr("width", function (d) {
      return d.numCols * cellWidth;
    })
    .attr("height", function (d) {
      return d.numRows * cellWidth;
    })
    .style("fill", function (d) {
      return d.color;
    })
    .style("stroke", "black")
    .style("stroke-width", 1);
}

function addDynamicAgents() {
  // customers are dynamic agents: they enter the clinic, wait, get treated, and then leave
  // We have entering customers of two types "basketShopper" and "trolleyShopper"
  // We could specify their probabilities of arrival in any simulation step separately
  // Or we could specify a probability of arrival of all customers and then specify the probability of a Type A arrival.
  // We have done the latter. probArrival is probability of arrival a customer and probBasketShopper is the probability of a type A customer who arrives.
  // First see if a customer arrives in this sim step.
  if (Math.random() < probArrival) {
    var newcustomer = {
      id: 1,
      type: "basketShopper",
      location: { row: 1, col: 1 },
      target: { row: 2, col: 2 },
      state: SHOPPING,
      timeAdmitted: 0,
    };
    if (Math.random() < probBasketShopper) newcustomer.type = "basketShopper";
    else newcustomer.type = "trolleyShopper";
    customers.push(newcustomer);
  }
}

function updatecustomer(customerIndex) {
  //customerIndex is an index into the customers data array
  customerIndex = Number(customerIndex); //it seems customerIndex was coming in as a string
  var customer = customers[customerIndex];
  // get the current location of the customer
  var row = customer.location.row;
  var col = customer.location.col;
  var type = customer.type;
  var state = customer.state;

  // determine if customer has arrived at destination
  var hasArrived =
    Math.abs(customer.target.row - row) + Math.abs(customer.target.col - col) ==
    0;

  // Behavior of customer depends on his or her state
  switch (state) {
    case SHOPPING:
      customer.target.row =
        shoppingArea.startRow +
        Math.floor(Math.random() * shoppingArea.numRows);
      customer.target.col =
        shoppingArea.startCol +
        Math.floor(Math.random() * shoppingArea.numCols);

      if (Math.random() < probShopping) {
        customer.state = WAITING;
        customer.target.row =
          regularCheckoutArea.startRow +
          Math.floor(Math.random() * regularCheckoutArea.numRows);
        customer.target.col =
          regularCheckoutArea.startCol + regularCheckoutArea.numCols - 1;

        customer.id = nextCustomerID;
        nextCustomerID++;
      }
      break;
    case WAITING:
      console.log(
        "my customer id is " +
          customer.id +
          " and the next regular serviced customer id is " +
          nextRegularServicedCustomerID
      );
      if (customer.id == nextRegularServicedCustomerID) {
        customer.target.row = regularCounterStartRow;
        customer.target.col = regularCounterStartCol;
        customer.state = TRANSACTION;
      }

      break;
    case TRANSACTION:
      // For this model we will give access to the regularCheckout on a first come, first served basis
      if (hasArrived) {
        regularCheckout.state = BUSY;
        if (Math.random() < probDeparture) {
          customer.state = LEAVING;
          regularCheckout.state = IDLE;
          customer.target.row = 1;
          customer.target.col = maxCols;
          nextRegularServicedCustomerID++;
        }
      }
      break;
    case LEAVING:
      if (hasArrived) {
        customer.state = EXITED;
      }
      break;
  }
  // set the destination row and column
  var targetRow = customer.target.row;
  var targetCol = customer.target.col;
  // compute the distance to the target destination
  var rowsToGo = targetRow - row;
  var colsToGo = targetCol - col;
  // set the speed
  var cellsPerStep = 1;
  // compute the cell to move to
  var newRow =
    row + Math.min(Math.abs(rowsToGo), cellsPerStep) * Math.sign(rowsToGo);
  var newCol =
    col + Math.min(Math.abs(colsToGo), cellsPerStep) * Math.sign(colsToGo);

  //Seems like that min function is not necessary. Since math.sign(0) returns 0, the agent does not move.
  /*   var newRow = row + cellsPerStep * Math.sign(rowsToGo);
  var newCol = col + cellsPerStep * Math.sign(colsToGo); */
  // update the location of the customer
  customer.location.row = newRow;
  customer.location.col = newCol;
}

function removeDynamicAgents() {
  // We need to remove customers who have been discharged.
  //Select all svg elements of class "customer" and map it to the data list called customers
  var allcustomers = surface.selectAll(".customer").data(customers);
  //Select all the svg groups of class "customer" whose state is EXITED
  var treatedcustomers = allcustomers.filter(function (d, i) {
    return d.state == EXITED;
  });
  // Remove the svg groups of EXITED customers: they will disappear from the screen at this point
  treatedcustomers.remove();

  // Remove the EXITED customers from the customers list using a filter command
  customers = customers.filter(function (d) {
    return d.state != EXITED;
  });
  // At this point the customers list should match the images on the screen one for one
  // and no customers should have state EXITED
}

function updateDynamicAgents() {
  // loop over all the agents and update their states
  for (var customerIndex in customers) {
    updatecustomer(customerIndex);
  }
  updateSurface();
}

function simStep() {
  //This function is called by a timer; if running, it executes one simulation step
  //The timing interval is set in the page initialization function near the top of this file
  if (isRunning) {
    //the isRunning variable is toggled by toggleSimStep
    // Increment current time (for computing statistics)
    currentTime++;
    // Sometimes new agents will be created in the following function
    addDynamicAgents();
    // In the next function we update each agent
    updateDynamicAgents();
    // Sometimes agents will be removed in the following function
    removeDynamicAgents();
  }
}
