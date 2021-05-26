$(document).ready(function () {

    loadItems();

});

function loadItems() {

    //clear out the existing items in the table, to add new ones
    clearItemTable();
    //grabs the reference to the place in the HTML where we add the table items
    var contentRows = $('#contentRows');

    $.ajax({
        type: 'GET',
        url: 'http://tsg-vending.herokuapp.com/items',
        success: function(itemArray) {
            //establishes a 'cell' variable, for the purpose of holding the tr objects while they are still under construction
            //I implemented this to solve an annoying error where sequentially appending individual tds led to trs being appended on
            var cell = '';
            $.each(itemArray, function(index, item){
                //retrieve the relevant fields from the given item
                var id = item.id;
                var name = item.name;
                var price = item.price;
                var quantity = item.quantity;

                //if this item would be the first of a set of 3, add a tr to the head of the cell var
                if ((index+1) % 3 == 1) {
                    cell += '<tr>';
                }
                //append the various subobjects for the td, filling in the necessary information from the fields
                    cell += '<td class="boxed item" id=' + id + '>';

                    cell += '<h2 class="item-text" style="text-align:left" id="count">';
                    cell += (index+1);
                    cell += '</h2>';

                    cell += '<h2 class="item-text">';
                    cell += name;
                    cell += '</h2>';

                    cell += '<h2 class="item-text" style="text-align:center">$';
                    cell += price;
                    cell += '</h2>';

                    cell += '';
                    cell += '<div class="quantity">';
                    cell += '<h2 class="item-text">Quantity Left: ';
                    cell += quantity;
                    cell += '</h2>';
                    cell += '</div>';

                    cell += '</td>';

                //if this would be the third of a set of three, close the tr, append the cell to the html reference, and reset the variable
                if ((index+1) % 3 == 0) {
                    cell += '</tr>';
                    contentRows.append(cell);
                    cell = '';
                }
            })
            //if we come out of the process without a multiple of three (ie, a group of 1/2), close the tr and append it to the html
            if (cell != '') {
                cell += '</tr>';
                contentRows.append(cell);
            }

        },
        error: function() {
            $('#errorMessages')
                .append($('<li>')
                .attr({class: 'list-group-item list-group-item-danger'})
                .text('Error calling web service. Please try again later.'));
        }
    });
    
}

function purchaseItem() {
    //extract the item's id and the amount of money from the HTML
    var id = $("#selectedItemId").val();
    var amount = $("#totalMoney").val();
    //if no item is selected (represented by id 0), just prompt the user to select an item
    if (id == "0") {
        $('#messageBox').text("Please select an item first!");
    }
    else {
        $.ajax({
            type: 'POST',
            url: ('http://tsg-vending.herokuapp.com/money/' + amount + '/item/' + id),
            success: function(data, status) {
                //if the post is sucessful, set the thank you message, and reset the selection fields
                $('#messageBox').text("Thank You!!");
                $('#selectBox').text("");
                $('#selectedItemID').val("0");
                //then, set the change
                setChange(data.quarters, data.dimes, data.nickels, data.pennies);
                //finally, set the money to its new total, derived from the change values from the data
                var inVal = data.quarters*0.25 + data.dimes*0.10 + data.nickels*0.05 + data.pennies*0.01;
                var updated = (inVal).toFixed(2);
                //set both the box and the input field
                $('#moneyBox').text("$" + updated);
                $('#totalMoney').val(updated);
            },
            error: function(data){
                //if the post fails, parse it into JSON and load the message field into the messageBox
                var obj = JSON.parse(data.responseText);
                $('#messageBox').text(obj.message);
            }
        });
        //load items to refresh the inventory
        loadItems();
    }
}

function clearItemTable() {
    $('#contentRows').empty();
}

//function called by the "Add Coin" buttons, with varying amounts per button
function addMoney(a) {
    //call resetFields to reset inputs if a purchase has just been made
    resetFields();
    //parse the inputted new amount and the current total into floats, add them, and then round to 2 decimal places
    var inVal = parseFloat(a);
    var current = parseFloat($('#totalMoney').val());
    var updated = (current + inVal).toFixed(2);
    //load the new value into the html
    $('#moneyBox').text("$" + updated);
    $('#totalMoney').val(updated);
}

//function called by clicking on the tds of the lefthand table, which represent the items
$("#itemTable").on("click", "td", function() {
    //call resetFields to reset inputs if a purchase has just been made
    resetFields();
    //extract the visible count (the number in the upper lefthand corner) as well as the invisible item id
    var id = ($( this ).attr('id'));
    var count = $( this ).find('#count').text();
    //set the selectBox to the visible count and the selectedItemID field to the item id
    $('#selectBox').text(count);
    $('#selectedItemId').val(id);
   });

//function called by clicking on the "Change Return" button
$("#changeButton").on("click", function() {
    //call resetFields to reset inputs if a purchase has just been made
    resetFields();
    //parse the current amount of money as a float
    var current = parseFloat($('#totalMoney').val());
    //for each coin type, get the quotient of its value (representing the number of units of it you have) and the modulus (the remaining value to be accounted for)
    var quarters = Math.floor(current/0.25);
        current = current % 0.25;
    var dimes = Math.floor(current/0.10);
        current = current % 0.10;
    var nickels = Math.floor(current/0.05);
    var pennies = Math.floor((current % 0.05)/0.01);
    //reset the messageBox, reset the money, and call setChange to display the change
    $('#messageBox').text("");
    $('#moneyBox').text("$0.00");
    $('#totalMoney').val(0.00).toFixed(2);
    setChange(quarters, dimes, nickels, pennies);
   });

//helper function to create the correctly formatted change string
function setChange(quarters, dimes, nickels, pennies) {
    var changeString = "";
    //for each type of coin, get the substring
    changeString += getChangeString(quarters, "quarter");
    changeString += getChangeString(dimes, "dime");
    changeString += getChangeString(nickels, "nickel");
    changeString += getChangeString(pennies, "pennie");
    //slice off the extra space at the end and set the changeBox
    changeString = changeString.slice(0, -1);
    $('#changeBox').text(changeString);
}

//helper function for change substrings, mostly here to avoid some weird logic and bc of the penny/pennies case
function getChangeString (v, n) {
    switch(v) {
        case 0:
            //if you have 0 of the coin, just return the empty string
            return "";
        case 1:
            //if you have 1 penny, return the specific string (stupid y pluralization rules)
            if (n == "pennie") {
                return ("1 penny ");
            }
            //otherwise, just do the normal operation
            else {
                return ("1 " + n + " ");
            }
        default:
            //if you have more than one coin, just pluralize
            return ("" + v + " " + n + "s ");
    }
}

//resets input fields if the post-purchase message is seen
//called to reset when putting in new inputs after a purchase
function resetFields() {
    var message = $('#messageBox').text();
    if (message === "Thank You!!") {
        $('#messageBox').text("");
        $('#changeBox').text("");
        $('#selectBox').text("");
        $('#selectedItemId').val("0");
    }
}

