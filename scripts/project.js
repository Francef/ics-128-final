class Catalog {
    API_URL             = "https://fakestoreapi.com/products";
    CURRENCY_API        = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cad.json";
    BACKUP_CURRENCY_API = "https://deepblue.camosun.bc.ca/~c0180354/ics128/final/currencies-cad.json";
    BACKUP_API_URL      = "https://deepblue.camosun.bc.ca/~c0180354/ics128/final/fakestoreapi.json"; 
    constructor() {
        this.product_data       = [];
        this.currency_data      = {};
        this.currSymbols        = { cad: "$", usd: "US$", gbp: "&#163;" };            // the currency symbols we will be using
        this.load_currency_data();
        this.load_data_with_fetch();
        this.currency = get_cookie("cart-currency");
        this.shippingProvince   = "";
        this.shippingCountry    = "";
        this.$taxes             = 0;                                                // to store tax amount for the JSON fetch via post object
        this.$finalTotal        = 0;                                                // to store total amount for the JSON fetch via post object

        // ensure the default currency is Canadian dollars
        if (this.currency == "" || this.currency == undefined || this.currency == null) {
            this.currency = "cad";
        }
    }


    /* Loads the item data and calls to render_catalog() */
    load_data_with_fetch() {
        fetch(this.API_URL).
            then(response => response.json()).
            then((json) => {
                this.product_data = json;
                this.render_catalog();
            }).catch(function() {
                fetch(this.BACKUP_API_URL).then(response => response.json()).then(json => {         // use this backup url if the first doesn't work
                    this.product_data = json;
                    this.render_catalog();
                })
            });
    }
    /* Loads currency data and calls to render_catalog */
    load_currency_data() {
        fetch(this.CURRENCY_API).
            then(response => response.json()).
            then((json) => {
                this.currency_data = json;
                if (this.product_data > 0) {
                    this.render_catalog();
                }
            }).catch(function() {
                fetch(this.BACKUP_CURRENCY_API).then(response => response.json()).then(json => {         // use this backup url if the first doesn't work
                    this.currency_data = json;
                    if (this.product_data > 0) {
                        this.render_catalog();
                    }
                })
            });
    }
    
    /* renders the items and data on the page */

    render_catalog() {
        $(`#catalog`).html("");
        for (let product of this.product_data) {
            let { id, title, description, image, price } = product;
            let conversion_rate = this.currency_data['cad'][this.currency];     // determine the current conversion rate of the chosen currency

            price = price * conversion_rate;
            price = parseFloat(price).toFixed(2);
            let symbol = this.currSymbols[this.currency];                       // the chosen currency's currency symbol
            let card = `<div class="col-sm-6 col-lg-4 mb-4"><div class="card">
					<img src="${image}" alt="${title}">
					<div class="card-body">
						<h5 class="card-title">${title}</h5>
						<p class="card-text">${description}</p>
                        <p class="price">${symbol}${price}</p>
                        <button class="btn btn-success addToCart" data-id="${id}">Add to Cart</button>
					</div>
				</div>
                </div>`; 
            document.querySelector(`#catalog`).innerHTML += card;
        }
        let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
        jQuery(catalog_container).imagesLoaded(function () {
            var msnry = new Masonry(catalog_container);             // this initializes the masonry container AFTER the product images are loaded
        });

        this.add_event_handlers();
    }

    // returns a single item from the basket or returns an empty object if nothing is found
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
        let basket          = "";
        var basketItems     = get_cookie("shopping_cart_items");                    // get shopping cart items
        let orderSubtotal   = 0;
        let currSymbol      = this.currSymbols[this.currency];                      // find the currency symbol of the selected currency
        
        for (let product_id in basketItems) {
            let product = this.getItem(product_id);
            let itemCount = basketItems[product_id];

            let conversion_rate = this.currency_data['cad'][this.currency];         // determine the conversion rate of cad to the current currency
            
            let price = product.price * conversion_rate;
            price = parseFloat(price).toFixed(2);

            let itemSubtotal = parseFloat(price * itemCount).toFixed(2);
            orderSubtotal = orderSubtotal + (price * itemCount);

            basket += `<tr><td><button class='btn btn-danger deleteItem' data-id='${product_id}'><span class='material-symbols-outlined'>
            delete </span></button><td>${product.title}</td><td>${itemCount}</td><td>${currSymbol}${price}</td><td>${currSymbol}${itemSubtotal}</td></tr>`;
        }
        if (basket != "") {
        orderSubtotal = parseFloat(orderSubtotal).toFixed(2);
        basket += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Order Subtotal</td><td>${currSymbol}${orderSubtotal}</td></tr>`
        }

        if (basket!= "") {
            basket = `<table id='table' class='table'><tr><th>&nbsp;</th><th>Item</th><th>Qty</th><th>Price</th><th>Item Subtotal</th></tr>` + basket + `</table>`;
            $(`#checkout`).show();              // show the checkout, empty cart buttons if basket has items
            $(`#emptyCart`).show(); 
        } else {
            basket = "Your cart is empty.";
            $(`#checkout`).hide();              // hide the checkout, empty cart buttons if basket has no items
            $(`#emptyCart`).hide();
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

    // delete a single id product from the cart
    deleteFromBasket(product_id) {
        let basketItems = get_cookie("shopping_cart_items");
        delete basketItems[product_id];
        set_cookie("shopping_cart_items", basketItems)
    }

    // sets currency to the cart currency and then renders catalog and cart items to show with the new currency
    setCurrency(currency) {
        this.currency = currency;
        set_cookie(`cart-currency`, currency);
        this.render_catalog();
        this.renderCartItems();
    }

    renderCheckoutItems() {
        let basket          = "";
        var basketItems     = get_cookie("shopping_cart_items");
        let orderSubtotal   = 0;                                             
        let currSymbol      = this.currSymbols[this.currency];                   // the currency symbol
        let shipping        = 10;                                                // a flat-rate shipping cost
        let taxes           = 0;                                                 // the amount of taxes the customer will pay on their order
        shipping            = parseFloat(shipping).toFixed(2);
        
        for (let product_id in basketItems) {
            let product = this.getItem(product_id);
            let itemCount = basketItems[product_id];

            let conversion_rate = this.currency_data['cad'][this.currency];
            
            let price = product.price * conversion_rate;
            price = parseFloat(price).toFixed(2);

            let itemSubtotal = parseFloat(price * itemCount).toFixed(2);
            orderSubtotal = orderSubtotal + (price * itemCount);

            basket += `<tr><td>${product.title}</td><td>${itemCount}</td><td>${currSymbol}${price}</td><td>${currSymbol}${itemSubtotal}</td></tr>`;
        }
        if (basket != "") {
        orderSubtotal = parseFloat(orderSubtotal).toFixed(2);
        basket += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>Order Subtotal</td><td>${currSymbol}${orderSubtotal}</td></tr>`
        }

        if (this.shippingCountry === "CA") {
            // if the country we are shipping to is Canada, apply proper taxes based on the province

            // object storing provincial tax rates as decimal numbers
            let provincialTaxes = { AB: "0.05", BC: "0.12", MB: "0.12", NB: "0.15", NL: "0.15", NT: "0.05", NS: "0.15", NU: "0.05", 
            ON: "0.13", PEI: "0.15", QC: "0.14975", SK: "0.11", YT: "0.05" };

            // variable storing the selected shipping province's tax rate
            let taxRate = parseFloat(provincialTaxes[this.shippingProvince]);

            taxes = ((parseFloat(orderSubtotal) + parseFloat(shipping)) * taxRate).toFixed(2);
            // calculating post-tax + shipping cost for a Canadian shipping address
            let finalTotal = parseFloat(parseFloat(taxes) + parseFloat(orderSubtotal) + parseFloat(shipping)).toFixed(2);
            set_cookie('orderTaxes', taxes);
            set_cookie('orderTotal', finalTotal);

            basket =`<table id='table' class='table'><tr><th>Item</th><th>Qty</th><th>Price</th><th>Item Subtotal</th></tr>` + basket + 
            `<tr><td>&nbsp;</td><td>&nbsp;</td><td>Shipping</td><td>${currSymbol}${shipping}</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td>
            <td>Taxes</td><td>${currSymbol}${taxes}</td></tr></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td><b>Final Total</td><td>${currSymbol}${finalTotal}</b></td></tr></table>`;
            $(`#orderTotals`).html(basket);
        } else {
            // if the country we are shipping to isn't Canada, don't charge any tax

            taxes = parseFloat(taxes).toFixed(2);
            let finalTotal = parseFloat(orderSubtotal) + parseFloat(shipping);
            set_cookie('orderTaxes', taxes);
            set_cookie('orderTotal', finalTotal);
            basket =`<table id='table' class='table'><tr><th>Item</th><th>Qty</th><th>Price</th><th>Item Subtotal</th></tr>` + basket + 
            `<tr><td>&nbsp;</td><td>&nbsp;</td><td>Shipping</td><td>${currSymbol}${shipping}</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td>
            <td>Taxes</td><td>${currSymbol}${taxes}</td></tr></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td><b>Final Total</td><td>${currSymbol}${finalTotal}</b></td></tr></table>`;
            $(`#orderTotals`).html(basket);
        }
    }

    validatePayment() {
        let ccard       = $(`#cc-number`).val();                    // the entered credit card number
        ccard           = ccard.replace(/\s+/g, '');                // strip whitespace from credit card before validation
        let ccMonth     = $(`#cc-month`).val();                     // the entered expiration month
        let ccYear      = $(`#cc-year`).val();                      // the entered expiration year
        let CVV         = $(`#cc-cvv`).val();                       // the entered cvv
    
        // Proper regex for creditcards, valid month, valid year, and CVV
        let validMastercard =  /^5[1-5][0-9]{14}|^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[0-1]\\d|2720)[0-9]{12}$/;
        let validVisa       = /^4[0-9]{12}(?:[0-9]{3})?$/;
        let validAmex       = /^3[47]\d{13,14}$/;
        let validMonth      = /^(0[1-9]|1[0-2])$/;
        let validYear       = /([2-3]{1})([0-9]{1})$/;
        let validCVV        = /^[0-9]{3,4}$/;
    
        let currentDate     = new Date();
        let currentMonth    = currentDate.getMonth();
        let currentYear     = currentDate.getFullYear();
        currentYear         = currentYear.toString().substring(2); // get current year as two digit YY
    
        let cardNumOk   = false;                                   // cardNumOk, mmYYok, CVVok are all booleans to check to see if form inputs are valid 
        let mmYYok      = false;
        let CVVok       = false;
    
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
            if ((parseInt(ccYear) + parseInt(ccMonth)) < (parseInt(currentYear) + parseInt(currentMonth))) {
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
    
    
    validateBilling() {
        let userFName       = $(`#firstName`).val();                // Entered first name
        let userLName       = $(`#lastName`).val();                 // Entered last name
        let userAddress     = $(`#address`).val();                  // Entered address
        let userAddress2    = $(`#address2`).val();                 // Entered apartment/unit #
        let userCity        = $(`#city`).val();                     // Entered city
        let userProvince    = $(`#province`).val();                 // Entered province

        let userState       = $(`#state`).val();                    // Entered shipping state
        let userCountry     = $(`#country`).val();                  // Entered country
        let userPostal      = $(`#postal`).val();                   // Entered postal code
        let userZip         = $(`#zip`).val();                      // Entered zip code
        let userUkPostal    = $(`ukpostal`).val();                  // Entered UK postal code
        let userPhone       = $(`#phone`).val();                    // Entered phone num
        let userEmail       = $(`#email`).val();                    // Entered email
    
        let goodAddress     = /^\s*\S+(?:\s+\S+){2}/;
        let goodCity        = /^[a-zA-Z',.\s-]{1,25}$/;
        let goodPostal      = /^([A-CEG-HJ-NPR-TVX-Ya-ceg-hj-npr-tvx-y]{1})([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})[ -]?([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})([0-9]{1})/;
        let goodPhone       = /^\s*(?:\+?([1]))?[-. (]*(?!^.11)([2-9]{1}[0-8]{1}[0-9]{1})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;
        let goodEmail       = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/;
        let goodZip         = /^\d{5}(?:[- ]?\d{4})?$/;
        let goodUkPostal    = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/;         // regex for valid UK postal code
    
        // initially set validity boolean to false
        let fNameOk     = false; 
        let lNameOk     = false;
        let addressOk   = false;
        let cityOk      = false;
        let provinceOk  = false;
        let stateOk     = false;
        let countryOk   = false;
        let postalOk    = false;
        let zipOk       = false;
        let ukPostalOk  = false;
        let phoneOk     = false;
        let emailOk     = false;
    
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
    
        if (userState === "") {
            stateOk = false;
            $(`#invalid-state`).show();
            $(`#valid-state`).hide();
        } else {
            stateOk = true;
            $(`#invalid-state`).hide();
            $(`#valid-state`).show();
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
    
        if (goodZip.test(userZip)) {
            zipOk = true;
            $(`#invalid-zip`).hide();
            $(`#valid-zip`).show();
        } else {
            zipOk = false;
            $(`#invalid-zip`).show();
            $(`#valid-zip`).hide();
        }
    
        if (goodUkPostal.test(userUkPostal)) {
            ukPostalOk = true;
            $(`#invalid-ukpostal`).hide();
            $(`#valid-ukpostal`).show();
        } else {
            ukPostalOk = false;
            $(`#invalid-ukpostal`).show();
            $(`#valid-ukpostal`).hide();
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
        if (userCountry == "UK") {
            if (fNameOk && lNameOk && addressOk && cityOk && ukPostalOk && phoneOk && emailOk) { 
                // if all sections have been completed correctly for the UK, then allow click to the next tab
                $(`#pills-shipping-tab`).click();
            }
        } else if (fNameOk && lNameOk && addressOk && cityOk && (provinceOk || stateOk) && countryOk && (postalOk || zipOk) && phoneOk && emailOk) { 
            // if all sections have been completed correctly for Canada or the US, then allow click to the next tab
            $(`#pills-shipping-tab`).click();
        }
    
    }

    validateShipping() {
        let suserFName          = $(`#sfirstName`).val();               // Entered shipping first name
        let suserLName          = $(`#slastName`).val();                // Entered shipping last name
        let suserAddress        = $(`#saddress`).val();                 // Entered shipping address
        let suserAddress2       = $(`#saddress2`).val();                // Entered shipping apartment/unit #
        let suserCity           = $(`#scity`).val();                    // Entered shipping city
        let suserProvince       = $(`#sprovince`).val();                // Entered shipping province
        this.shippingProvince   = suserProvince;                        // for use in calculating taxes

        let suserState          = $(`#sstate`).val();                   // Entered shipping state
        let suserCountry        = $(`#scountry`).val();                 // Entered shipping country
        this.shippingCountry    = suserCountry;                         // for use in calculating taxes 

        let suserPostal         = $(`#spostal`).val();                  // Entered shipping postal code
        let suserZip            = $(`#szip`).val();                     // Entered zip code
        let susersUkPostal      = $(`sukpostal`).val();                 // Entered UK postal code
        let suserPhone          = $(`#sphone`).val();                   // Entered shipping phone num
    
        let goodAddress         = /^\s*\S+(?:\s+\S+){2}/;
        let goodCity            = /^[a-zA-Z',.\s-]{1,25}$/;
        let goodPostal          = /^([A-CEG-HJ-NPR-TVX-Ya-ceg-hj-npr-tvx-y]{1})([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})[ -]?([0-9]{1})([A-CEG-HJ-NPR-TV-Za-ceg-hj-npr-tv-z]{1})([0-9]{1})/;
        let goodPhone           = /^\s*(?:\+?([1]))?[-. (]*(?!^.11)([2-9]{1}[0-8]{1}[0-9]{1})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;
        let goodZip             = /^\d{5}(?:[- ]?\d{4})?$/;
        let goodUkPostal        = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/;             // regex for UK postal codes
    
        // initially set validity boolean to false
        let sfNameOk    = false; 
        let slNameOk    = false;
        let saddressOk  = false;
        let scityOk     = false;
        let sprovinceOk = false;
        let sstateOk    = false;
        let scountryOk  = false;
        let spostalOk   = false;
        let szipOk      = false;
        let sukPostalOk = false;
        let sphoneOk    = false;
    
        if (suserFName === "") {
            sfNameOk = false;
            $(`#invalid-sfname`).show();
            $(`#valid-sfname`).hide();
        } else {
            sfNameOk = true;
            $(`#invalid-sfname`).hide();
            $(`#valid-sfname`).show();
        }
    
        if (suserLName === "") {
            slNameOk = false;
            $(`#invalid-slname`).show();
            $(`#valid-slname`).hide();
        } else {
            slNameOk = true;
            $(`#invalid-slname`).hide();
            $(`#valid-slname`).show();
        }
    
        if (goodAddress.test(suserAddress)) {
            saddressOk = true;
            $(`#invalid-saddress`).hide();
            $(`#valid-saddress`).show();
        } else {
            saddressOk = false;
            $(`#invalid-saddress`).show();
            $(`#valid-saddress`).hide();
        }
    
        if (goodCity.test(suserCity)) {
            scityOk = true;
            $(`#invalid-scity`).hide();
            $(`#valid-scity`).show();
        } else {
            scityOk = false;
            $(`#invalid-scity`).show();
            $(`#valid-scity`).hide();
        }
    
        if (suserProvince === "") {
            sprovinceOk = false;
            $(`#invalid-sprovince`).show();
            $(`#valid-sprovince`).hide();
        } else {
            sprovinceOk = true;
            $(`#invalid-sprovince`).hide();
            $(`#valid-sprovince`).show();
        }
    
        if (suserState === "") {
            sstateOk = false;
            $(`#invalid-sstate`).show();
            $(`#valid-sstate`).hide();
        } else {
            sstateOk = true;
            $(`#invalid-sstate`).hide();
            $(`#valid-sstate`).show();
        }
    
        if (suserCountry === "") {
            scountryOk = false;
            $(`#invalid-scountry`).show();
            $(`#valid-scountry`).hide();
        } else {
            scountryOk = true;
            $(`#invalid-scountry`).hide();
            $(`#valid-scountry`).show();
        }
    
        if (goodPostal.test(suserPostal)) {
            spostalOk = true;
            $(`#invalid-spostal`).hide();
            $(`#valid-spostal`).show();
        } else {
            spostalOk = false;
            $(`#invalid-spostal`).show();
            $(`#valid-spostal`).hide();
        }
    
        if (goodZip.test(suserZip)) {
            szipOk = true;
            $(`#invalid-szip`).hide();
            $(`#valid-szip`).show();
        } else {
            szipOk = false;
            $(`#invalid-szip`).show();
            $(`#valid-szip`).hide();
        }
    
        if (goodUkPostal.test(susersUkPostal)) {
            sukPostalOk = true;
            $(`#invalid-sukpostal`).hide();
            $(`#valid-sukpostal`).show();
        } else {
            sukPostalOk = false;
            $(`#invalid-sukpostal`).show();
            $(`#valid-sukpostal`).hide();
        }
    
        if (goodPhone.test(suserPhone)) {
            sphoneOk = true;
            $(`#invalid-sphone`).hide();
            $(`#valid-sphone`).show();
        } else {
            sphoneOk = false;
            $(`#invalid-sphone`).show();
            $(`#valid-sphone`).hide();
        }
    
        if (suserCountry == "UK") {
            if (sfNameOk && slNameOk && saddressOk && scityOk && sukPostalOk && sphoneOk && semailOk) { 
                // if all sections have been completed correctly for the UK, then allow click to the next tab
                $(`#pills-confirmation-tab`).click();
            }
        } else if (sfNameOk && slNameOk && saddressOk && scityOk && (sprovinceOk || sstateOk) && scountryOk && (spostalOk || szipOk) && sphoneOk) { 
            // if all sections have been completed correctly for Canada or the US, then allow click to the next tab
            $(`#pills-confirmation-tab`).click();
        }
    }

add_event_handlers() {

 $(".addToCart").click(function() {
    //get the product id that had its "add to cart" button clicked
    var product_id = $(this).attr("data-id");
    var currentItem = this;
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

    $(currentItem).html(`<span class='badge badge-light'>Add to Cart ${cart_items[product_id]}</span>`); // display the amount of the current item in the Add to Cart button
    set_cookie("shopping_cart_items", cart_items); // setting the cart items back to the cookie storage
});

// renders the items in the offcanvas cart
$(`#viewCart`).click(function() {
    catalog.renderCartItems();
});

// change the catalog's currency to the selected currency
$(`#selectCurrency`).on(`change`, function() {
    catalog.setCurrency($(this).val());
});

// render checkout items in the final confirmation before placing order
$(`#pills-confirmation-tab`).click(function() {
    catalog.renderCheckoutItems();
});

// only show select input areas depending on the billing country
$(`#country`).change(function () {
    let selectedCountry = $(`#country`).val();
    if (selectedCountry === "") {
        $(`#divProvince`).hide();
        $(`#divState`).hide();
        $(`#divPostal`).hide();
        $(`#divzip`).hide();
        $(`#divUkPostal`).hide();
    } else if (selectedCountry === "CA") {
        $(`#divProvince`).show();
        $(`#divPostal`).show();
        $(`#divState`).hide();
        $(`#divzip`).hide();
        $(`#divUkPostal`).hide();
    } else if (selectedCountry === "US") {
        $(`#divState`).show();
        $(`#divProvince`).hide();
        $(`#divzip`).show();
        $(`#divPostal`).hide();
        $(`#divUkPostal`).hide();
    } else if (selectedCountry === "UK") {
        $(`#divUkPostal`).show();
        $(`#divProvince`).hide();
        $(`#divState`).hide();
        $(`#divzip`).hide();
        $(`#divPostal`).hide();
    };
});

// only show select input areas depending on the shipping country
$(`#scountry`).change(function () {
    let selectedCountry = $(`#scountry`).val();
    if (selectedCountry === "") {
        $(`#divsProvince`).hide();
        $(`#divsState`).hide();
        $(`#divsPostal`).hide();
        $(`#divszip`).hide();
        $(`#divsUkPostal`).hide();
    } else if (selectedCountry === "CA") {
        $(`#divsProvince`).show();
        $(`#divsPostal`).show();
        $(`#divsState`).hide();
        $(`#divszip`).hide();
        $(`#divsUkPostal`).hide();
    } else if (selectedCountry === "US") {
        $(`#divsState`).show();
        $(`#divsProvince`).hide();
        $(`#divszip`).show();
        $(`#divsPostal`).hide();
        $(`#divsUkPostal`).hide();
    } else if (selectedCountry === "UK") {
        $(`#divsUkPostal`).show();
        $(`#divsProvince`).hide();
        $(`#divsState`).hide();
        $(`#divszip`).hide();
        $(`#divsPostal`).hide();
    };
});

// check to see if user has checked/unchecked the "shipping address is same as billing address" box, if so, set all validity checks to true
$(`#same-address`).change(function() {
    if(this.checked) {
        sfNameOk = slNameOk = saddressOk =  scityOk = sprovinceOk = sstateOk = scountryOk = sphoneOk = true;
        $(`#shippingForm`).hide();
    } else {
        $(`#shippingForm`).show();
}});


// event handler that first builds the submisstion_data object, then submits the JSON data to deepblue    
$(`#completeOrder`).click(function() {
    let submissionWeb   = "https://deepblue.camosun.bc.ca/~c0180354/ics128/final/";
    let submission_data = {};                                   
    let allProducts     = get_cookie("shopping_cart_items");        // get all shopping cart items
    let userCurrency    = get_cookie("cart-currency");              // get cookie that stores the user's currency
    let userCredit      =  $(`#cc-number`).val();                   // customer's credit card number
    userCredit          = userCredit.replace(/\s+/g, '');           // ensures the credit card number has whitespace removed
    let orderTaxes      = get_cookie('orderTaxes');                 // get cookie that stores tax data
    let finalTotal      = get_cookie('orderTotal');                 // get cookie that stores order total data


    /* submission data will change based on the country that was chosen as the shipping country */
    if ($(`#scountry`).val() === `CA`) {
        submission_data = {  
            card_number: userCredit,
            expiry_month: $(`#cc-month`).val(),
            expiry_year: ("20" + $(`#cc-year`).val()),
            security_code: $(`#cc-cvv`).val(),
            amount: finalTotal,
            taxes: orderTaxes,
            shipping_amount: '10.00',
            currency: userCurrency,
            items: { allProducts },
            billing: {
                first_name: $(`#firstName`).val(),
                last_name: $(`#lastName`).val(),
                address_1: $(`#address`).val(),
                address_2: $(`#address2`).val(),
                city: $(`#city`).val(),
                province: $(`#province`).val(),
                country: $(`#country`).val(),
                postal: $(`#postal`).val(),
                phone: $(`#phone`).val(),
                email: $(`#email`).val()
            },
            shipping: {
                first_name: $(`#sfirstName`).val(),
                last_name: $(`#slastName`).val(),
                address_1: $(`#saddress`).val(),
                address_2: $(`#saddress2`).val(),
                city: $(`#scity`).val(),
                province: $(`#sprovince`).val(),
                country: $(`#scountry`).val(),
                postal: $(`#spostal`).val()
        } };
    } else if ($(`#scountry`).val() === `US`) {
        submission_data = {  
            card_number: userCredit,
            expiry_month: $(`#cc-month`).val(),
            expiry_year: ("20" + $(`#cc-year`).val()),
            security_code: $(`#cc-cvv`).val(),
            amount: finalTotal,
            taxes: orderTaxes,
            shipping_amount: '10.00',
            currency: userCurrency,
            items: { allProducts },
            billing: {
                first_name: $(`#firstName`).val(),
                last_name: $(`#lastName`).val(),
                address_1: $(`#address`).val(),
                address_2: $(`#address2`).val(),
                city: $(`#city`).val(),
                province: $(`#state`).val(),
                country: $(`#country`).val(),
                postal: $(`#zip`).val(),
                phone: $(`#phone`).val(),
                email: $(`#email`).val()
            },
            shipping: {
                first_name: $(`#sfirstName`).val(),
                last_name: $(`#slastName`).val(),
                address_1: $(`#saddress`).val(),
                address_2: $(`#saddress2`).val(),
                city: $(`#scity`).val(),
                province: $(`#sstate`).val(),
                country: $(`#scountry`).val(),
                postal: $(`#szip`).val()
        } };
    } else {        
        submission_data = {  
        card_number: userCredit,
        expiry_month: $(`#cc-month`).val(),
        expiry_year: ("20" + $(`#cc-year`).val()),
        security_code: $(`#cc-cvv`).val(),
        amount: finalTotal,
        taxes: orderTaxes,
        shipping_amount: '10.00',
        currency: userCurrency,
        items: { allProducts },
        billing: {
            first_name: $(`#firstName`).val(),
            last_name: $(`#lastName`).val(),
            address_1: $(`#address`).val(),
            address_2: $(`#address2`).val(),
            city: $(`#city`).val(),
            province: $(`#province`).val(),
            country: $(`#country`).val(),
            postal: $(`ukpostal`).val(),
            phone: $(`#phone`).val(),
            email: $(`#email`).val()
        },
        shipping: {
            first_name: $(`#sfirstName`).val(),
            last_name: $(`#slastName`).val(),
            address_1: $(`#saddress`).val(),
            address_2: $(`#saddress2`).val(),
            city: $(`#scity`).val(),
            province: $(`#sprovince`).val(),
            country: $(`#scountry`).val(),
            postal: $(`sukpostal`).val()
    } };
}

    let form_data = new FormData();
    form_data.append('submission', JSON.stringify(submission_data)); 

    fetch(submissionWeb,
        { method: "POST",
          cache: "no-cache",
          body: form_data
    }).then((response) => response.json())
    .then((form_data) => {                          // if submission was successful, show the success modal, then close checkout modal and empty cart
      $(`#successfulSubmission`).modal(`show`);
      $('#checkoutModal').modal('toggle');
      catalog.emptyCart();
    })
    .catch((error) => {                             // if submission was unsuccessful, do this
      $(`#unsuccessfulSubmission`).modal(`show`);
    });

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
$(`#invalid-state`).hide();
$(`#valid-state`).hide();
$(`#invalid-country`).hide();
$(`#valid-country`).hide();
$(`#invalid-postal`).hide();
$(`#valid-postal`).hide();
$(`#invalid-zip`).hide();
$(`#valid-zip`).hide();
$(`#invalid-ukpostal`).hide();
$(`#valid-ukpostal`).hide();
$(`#invalid-phone`).hide();
$(`#valid-phone`).hide();
$(`#invalid-email`).hide();
$(`#valid-email`).hide();

$(`#invalid-sfname`).hide();
$(`#valid-sfname`).hide();
$(`#invalid-slname`).hide();
$(`#valid-slname`).hide();
$(`#invalid-saddress`).hide();
$(`#valid-saddress`).hide();
$(`#invalid-scity`).hide();
$(`#valid-scity`).hide();
$(`#invalid-sprovince`).hide();
$(`#valid-sprovince`).hide();
$(`#invalid-sstate`).hide();
$(`#valid-sstate`).hide();
$(`#invalid-scountry`).hide();
$(`#valid-scountry`).hide();
$(`#invalid-spostal`).hide();
$(`#valid-spostal`).hide();
$(`#invalid-szip`).hide();
$(`#valid-szip`).hide();
$(`#invalid-sukpostal`).hide();
$(`#valid-sukpostal`).hide();
$(`#invalid-sphone`).hide();
$(`#valid-sphone`).hide();

// in billing details hide province/state/postal/zip code until a country is selected

$(`#divProvince`).hide();
$(`#divState`).hide();
$(`#divPostal`).hide();
$(`#divzip`).hide();
$(`#divUkPostal`).hide();

// in shipping details hide province/state/postal/zip code until a country is selected
$(`#divsProvince`).hide();
$(`#divsState`).hide();
$(`#divsPostal`).hide();
$(`#divszip`).hide();
$(`#divsUkPostal`).hide();
