class Catalog {
    constructor() {
        this.product_data = [];
        this.load_data_with_fetch();
        this.currency_data = {};
        this.currency = get_cookie("cart-currency"); //NOT SURE ABOUT THIS!!
        this.symbols = { cad: "$", usd: "US$", gbp: "&#163;"};
        if (this.currency == "" || this.currency == undefined || this.currency == null) {
            this.currency == "cad";
        }
    }
    API_URL = "https://fakestoreapi.com/products";
    CURRENCY_API = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cad.json";
    
    load_currency_data() {
        fetch(this.CURRENCY_API).
            then(response => response.json()).
            then((json) => {
                this.currency = json;
                if (this.product_data > 0) {
                    this.currency = "cad";
                    this.render_catalog();
                }
            });
    }
    /* Loads the item data and calls to render_catalog() */
    load_data_with_fetch() {
        fetch(this.API_URL).
            then(response => response.json()).
            then((json) => {
                this.product_data = json;
                this.render_catalog();
            });
    }
    /* renders the items and data on the page */

    render_catalog() {
        for (let product of this.product_data) {
            let { id, title, description, image, price } = product;
            price = parseFloat(price).toFixed(2);
            //let conversion = this.currency_data[`cad`][this.currency]; //add index for usd and gbp
            //price = price * conversion;

            // let symbol = this.symbols[this.currency]; NEED TO FIX THIS
            let card = `<div class="col-sm-6 col-lg-4 mb-4"><div class="card">
					<img src="${image}" alt="${title}">
					<div class="card-body">
						<h5 class="card-title">${title}</h5>
						<p class="card-text">${description}</p>
                        <p class="price">${price}</p>
                        <button class="btn btn-success addToCart" data-id="${id}">Add to Cart</button>
					</div>
				</div>
                </div>`; // need to add ${symbol} before ${price} but not working yet
            document.querySelector(`#catalog`).innerHTML += card;
        }
        let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
        jQuery(catalog_container).imagesLoaded(function () {
            var msnry = new Masonry(catalog_container); // this initializes the masonry container AFTER the product images are loaded
        });

        this.add_event_handlers();
    }

    getItem(product_id) {

        for (let this_product of this.product_data) {
            if (this_product.id == product_id) {
                return this_product;
            }
        }

        if (typeof this.product[product_id] === undefined) {
            return {};
        }
        else {
            return this.product[product_id];
        }
    }

    renderCartItems() {
        let basket = "";
        var basketItems = get_cookie("shopping_cart_items");

        for (let product_id in basketItems) {
            let product = this.getItem(product_id);
            let itemCount = basketItems[product_id];
            product.price = parseFloat(product.price).toFixed(2);
            let itemSubtotal = parseFloat(product.price * itemCount).toFixed(2);
            basket += `<tr><td><button class='btn btn-danger deleteItem' data-id='${product_id}'><span class='material-symbols-outlined'>
            delete </span></button><td>${product.title}</td><td>${itemCount}</td><td>${product.price}</td><td>${itemSubtotal}</td></tr>`;
        }
        if (basket!= "") {
            basket = `<table id='table'><tr><th>Item</th><th>Qty</th><th>Price</th><th>Item Subtotal</th></tr>` + basket + `</table>`;
        } else {
            basket = "Your cart is empty.";
        }
        $(`#loadShoppingCart`).html(basket);

        $(`#emptyCart`).click(function() {
            catalog.emptyCart();
            catalog.renderCartItems();
        });

        $(`.deleteItem`).click(function() {
            catalog.deleteFromBasket($(this).attr(`data-id`));
            catalog.renderCartItems();
        });

    }

    emptyCart() {
        set_cookie("shopping_cart_items", {});
    }

    deleteFromBasket(product_id) {
        let basketItems = get_cookie("shopping_cart_items");
        delete basketItems[product_id];
        set_cookie("shopping_cart_items", basketItems)
    }

add_event_handlers() {

 //let data = get_cookie("shopping_cart_items");

 $(".addToCart").click(function() {
    //get the product id that had its "add to cart" button clicked
    var product_id = $(this).attr("data-id");
    var cart_items = get_cookie("shopping_cart_items"); // get the data stored as a cookie

    // initialize the cart items if it returns null
    if (cart_items === null) {
        cart_items = {};
    }

    // make sure object is defined
    if (cart_items[product_id] === undefined) {
        cart_items[product_id] = 0;
    }

    cart_items[product_id]++;

    $(this).prepend(`<span class="badge badge-light">` + cart_items[product_id] + `</span>`); // !!!!!!!!!!!!!!!THIS DOESN'T WORK GREAT :/ ADDS MULTIPLE NUMBERS
    set_cookie("shopping_cart_items", cart_items); // setting the cart items back to the cookie storage
});

$(`#viewCart`).click(function() {
    catalog.renderCartItems();
});


}
}

let catalog = new Catalog();


// hide credit card valid/invalid messages until ready
$(`#invalid-cc`).hide();
$(`#valid-cc`).hide();
$(`#invalid-mm`).hide();
$(`#invalid-yy`).hide();
$(`#valid-mm`).hide();
$(`#valid-yy`).hide();
$(`#valid-cvv`).hide();
$(`#invalid-cvv`).hide();

// hide billing/shipping valid/invalid messages until ready
$(`#invalid-fname`).hide();
$(`#valid-fname`).hide();
$(`#invalid-lname`).hide();
$(`#valid-lname`).hide();
$(`#invalid-address`).hide();
$(`#valid-address`).hide();
$(`#invalid-city`).hide();
$(`#valid-city`).hide();
$(`#invalid-province`).hide();
$(`#valid-province`).hide();
$(`#invalid-country`).hide();
$(`#valid-country`).hide();
$(`#invalid-postal`).hide();
$(`#valid-postal`).hide();
$(`#invalid-phone`).hide();
$(`#valid-phone`).hide();
$(`#invalid-email`).hide();
$(`#valid-email`).hide();


function validatePayment() {
    let ccard = $(`#cc-number`).val();              // the entered credit card number
    let ccMonth = $(`#cc-month`).val();             // the entered expiration month
    let ccYear = $(`#cc-year`).val();               // the entered expiration year
    let CVV = $(`#cc-cvv`).val();                   // the entered cvv

    // Proper regex for creditcards, valid month, valid year, and CVV
    let validMastercard =  /^5[1-5][0-9]{14}|^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[0-1]\\d|2720)[0-9]{12}$/;
    let validVisa = /^4[0-9]{12}(?:[0-9]{3})?$/;
    let validAmex = /^3[47]\d{13,14}$/;
    let validMonth = /^(0[1-9]|1[0-2])$/;
    let validYear = /([2-3]{1})([0-9]{1})$/;
    let validCVV = /^[0-9]{3,4}$/;

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    currentYear = currentYear.toString().substring(2); // get current year as two digit YY



    let cardNumOk = false; // cardNumOk, mmYYok, CVVok are all booleans to check to see if form inputs are valid 
    let mmYYok = false;
    let CVVok = false;

    // Checking validity of credit card
    if (validMastercard.test(ccard) || validVisa.test(ccard) || validAmex.test(ccard)) {
        cardNumOk = true;
        $(`#valid-cc`).show();
        $(`#invalid-cc`).hide();
    } else {
        cardNumOk = false;
        $(`#invalid-cc`).show();
        $(`#valid-cc`).hide();
    }

    // Checking validity of MM/YY
    if (validMonth.test(ccMonth) && validYear.test(ccYear)) {
        // if month/year in past, mark as invalid, otherwise mark as valid
        if ((ccYear + ccMonth) < (currentYear + currentMonth)) {
            mmYYok = false;
            $(`#invalid-mm`).show();
            $(`#invalid-yy`).show();
            $(`#valid-mm`).hide();
            $(`#valid-yy`).hide();
        } else {
            mmYYok = true;
            $(`#invalid-mm`).hide();
            $(`#invalid-yy`).hide();
            $(`#valid-mm`).show();
            $(`#valid-yy`).show();
        }
    } else {
        mmYYok = false;
        $(`#invalid-mm`).show();
        $(`#invalid-yy`).show();
        $(`#valid-mm`).hide();
        $(`#valid-yy`).hide();
    }

    // Checking validity of CVV
    if (validCVV.test(CVV)) {
        CVVok = true;
        $(`#valid-cvv`).show();
        $(`#invalid-cvv`).hide();
    } else {
        CVVok = false;
        $(`#valid-cvv`).hide();
        $(`#invalid-cvv`).show();
    }
    if (cardNumOk && mmYYok && CVVok) {
        $(`#pills-billing-tab`).click();
    }
}


function validateBilling() {
    let userFName = $(`#firstName`).val();            // Entered first name
    let userLName = $(`#lastName`).val();             // Entered last name
    let userAddress = $(`#address`).val();            // Entered address
    let userAddress2 = $(`#address2`).val();          // Entered apartment/unit #
    let userCity = $(`#city`).val();                  // Entered city
    let userProvince = $(`#province`).val();          // Entered province
    let userCountry = $(`#country`).val();            // Entered country
    let userPostal = $(`#postal`).val();              // Entered postal code
    let userPhone = $(`#phone`).val();                // Entered phone num
    let userEmail = $(`#email`).val();                // Entered email

    let goodAddress = /^\s*\S+(?:\s+\S+){2}/;
    let goodCity = /^[a-zA-Z',.\s-]{1,25}$/;
    let goodPostal = /^([A-CEG-HJ-NPR-TVX-Ya-ceg-hj-npr-tvx-y]{1})([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})[ -]?([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})([0-9]{1})/;
    let goodPhone = /^\s*(?:\+?([1]))?[-. (]*(?!^.11)([2-9]{1}[0-8]{1}[0-9]{1})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;
    let goodEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/;

    // initially set validity boolean to false
    let fNameOk = false; 
    let lNameOk = false;
    let addressOk = false;
    let cityOk = false;
    let provinceOk = false;
    let countryOk = false;
    let postalOk = false;
    let phoneOk = false;
    let emailOk = false;

    if (userFName === "") {
        fNameOk = false;
        $(`#invalid-fname`).show();
        $(`#valid-fname`).hide();
    } else {
        fNameOk = true;
        $(`#invalid-fname`).hide();
        $(`#valid-fname`).show();
    }

    if (userLName === "") {
        lNameOk = false;
        $(`#invalid-lname`).show();
        $(`#valid-lname`).hide();
    } else {
        lNameOk = true;
        $(`#invalid-lname`).hide();
        $(`#valid-lname`).show();
    }

    if (goodAddress.test(userAddress)) {
        addressOk = true;
        $(`#invalid-address`).hide();
        $(`#valid-address`).show();
    } else {
        addressOk = false;
        $(`#invalid-address`).show();
        $(`#valid-address`).hide();
    }

    if (goodCity.test(userCity)) {
        cityOk = true;
        $(`#invalid-city`).hide();
        $(`#valid-city`).show();
    } else {
        cityOk = false;
        $(`#invalid-city`).show();
        $(`#valid-city`).hide();
    }

    if (userProvince === "") {
        provinceOk = false;
        $(`#invalid-province`).show();
        $(`#valid-province`).hide();
    } else {
        provinceOk = true;
        $(`#invalid-province`).hide();
        $(`#valid-province`).show();
    }

    if (userCountry === "") {
        countryOk = false;
        $(`#invalid-country`).show();
        $(`#valid-country`).hide();
    } else {
        countryOk = true;
        $(`#invalid-country`).hide();
        $(`#valid-country`).show();
    }

    if (goodPostal.test(userPostal)) {
        postalOk = true;
        $(`#invalid-postal`).hide();
        $(`#valid-postal`).show();
    } else {
        postalOk = false;
        $(`#invalid-postal`).show();
        $(`#valid-postal`).hide();
    }

    if (goodPhone.test(userPhone)) {
        phoneOk = true;
        $(`#invalid-phone`).hide();
        $(`#valid-phone`).show();
    } else {
        phoneOk = false;
        $(`#invalid-phone`).show();
        $(`#valid-phone`).hide();
    }

    if (goodEmail.test(userEmail)) {
        emailOk = true;
        $(`#invalid-email`).hide();
        $(`#valid-email`).show();
    } else {
        emailOk = false;
        $(`#invalid-email`).show();
        $(`#valid-email`).hide();
    }

    if (fNameOk && lNameOk && addressOk && cityOk && provinceOk && countryOk && postalOk && phoneOk && emailOk) { 
        // if all sections have been completed correctly, then allow click to the next tab
        $(`#pills-shipping-tab`).click();
    }

}

function validateShipping() {
    let userFName = $(`#firstName`).val();            // Entered first name
    let userLName = $(`#lastName`).val();             // Entered last name
    let userAddress = $(`#address`).val();            // Entered address
    let userAddress2 = $(`#address2`).val();          // Entered apartment/unit #
    let userCity = $(`#city`).val();                  // Entered city
    let userProvince = $(`#province`).val();          // Entered province
    let userCountry = $(`#country`).val();            // Entered country
    let userPostal = $(`#postal`).val();              // Entered postal code
    let userPhone = $(`#phone`).val();                // Entered phone num
    let userEmail = $(`#email`).val();                // Entered email

    let goodAddress = /^\s*\S+(?:\s+\S+){2}/;
    let goodCity = /^[a-zA-Z',.\s-]{1,25}$/;
    let goodPostal = /^([A-CEG-HJ-NPR-TVX-Ya-ceg-hj-npr-tvx-y]{1})([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})[ -]?([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})([0-9]{1})/;
    let goodPhone = /^\s*(?:\+?([1]))?[-. (]*(?!^.11)([2-9]{1}[0-8]{1}[0-9]{1})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;
    let goodEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/;

    // initially set validity boolean to false
    let fNameOk = false; 
    let lNameOk = false;
    let addressOk = false;
    let cityOk = false;
    let provinceOk = false;
    let countryOk = false;
    let postalOk = false;
    let phoneOk = false;
    let emailOk = false;

    // check to see if user has checked/unchecked the "shipping address is same as billing address" box, if so, set all validity checks to true
    $(`#same-address`).change(function() {
        if(this.checked) {
            fNameOk = lNameOk = addressOk =  cityOk = provinceOk = countryOk = phoneOk = emailOk = true;
            $(`#shippingForm`).hide();
        } else {
            $(`#shippingForm`).show();
    }});

    if (userFName === "") {
        fNameOk = false;
        $(`#invalid-fname`).show();
        $(`#valid-fname`).hide();
    } else {
        fNameOk = true;
        $(`#invalid-fname`).hide();
        $(`#valid-fname`).show();
    }

    if (userLName === "") {
        lNameOk = false;
        $(`#invalid-lname`).show();
        $(`#valid-lname`).hide();
    } else {
        lNameOk = true;
        $(`#invalid-lname`).hide();
        $(`#valid-lname`).show();
    }

    if (goodAddress.test(userAddress)) {
        addressOk = true;
        $(`#invalid-address`).hide();
        $(`#valid-address`).show();
    } else {
        addressOk = false;
        $(`#invalid-address`).show();
        $(`#valid-address`).hide();
    }

    if (goodCity.test(userCity)) {
        cityOk = true;
        $(`#invalid-city`).hide();
        $(`#valid-city`).show();
    } else {
        cityOk = false;
        $(`#invalid-city`).show();
        $(`#valid-city`).hide();
    }

    if (userProvince === "") {
        provinceOk = false;
        $(`#invalid-province`).show();
        $(`#valid-province`).hide();
    } else {
        provinceOk = true;
        $(`#invalid-province`).hide();
        $(`#valid-province`).show();
    }

    if (userCountry === "") {
        countryOk = false;
        $(`#invalid-country`).show();
        $(`#valid-country`).hide();
    } else {
        countryOk = true;
        $(`#invalid-country`).hide();
        $(`#valid-country`).show();
    }

    if (goodPostal.test(userPostal)) {
        postalOk = true;
        $(`#invalid-postal`).hide();
        $(`#valid-postal`).show();
    } else {
        postalOk = false;
        $(`#invalid-postal`).show();
        $(`#valid-postal`).hide();
    }

    if (goodPhone.test(userPhone)) {
        phoneOk = true;
        $(`#invalid-phone`).hide();
        $(`#valid-phone`).show();
    } else {
        phoneOk = false;
        $(`#invalid-phone`).show();
        $(`#valid-phone`).hide();
    }

    if (goodEmail.test(userEmail)) {
        emailOk = true;
        $(`#invalid-email`).hide();
        $(`#valid-email`).show();
    } else {
        emailOk = false;
        $(`#invalid-email`).show();
        $(`#valid-email`).hide();
    }



    if ((fNameOk && lNameOk && addressOk && cityOk && provinceOk && countryOk && postalOk && phoneOk && emailOk)) {
        // if all sections have been completed correctly, allow click to the next tab
        $(`#pills-confirmation-tab`).click();
    }
}

