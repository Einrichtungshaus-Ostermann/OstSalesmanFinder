/**
 * Einrichtungshaus Ostermann GmbH & Co. KG - SalesmanFinder
 *
 * @package   OstSalesmanFinder
 *
 * @author    Tim Windelschmidt <tim.windelschmidt@ostermann.de>
 * @copyright 2019 Einrichtungshaus Ostermann GmbH & Co. KG
 * @license   proprietary
 */

;(function ($) {

    // use strict mode
    "use strict";

    // detail plugin
    $.plugin("ostSalesmanFinderSeller", {

        customerAvailableTemplate: "<div class=\"accept-customer-button\"><input type=\"submit\" name=\"accept-customer-button\" value=\"Ich übernehme\"></div>",

        state: false,



        createCustomer: function (customerID) {
            let me = this;


            var n = new Noty({
                text: 'Do you want to continue? <input id="example" type="text">',
                buttons: [
                    Noty.button('Ich Übernehme!', 'btn btn-success', function () {


                        console.log('button 1 clicked');

                        // Open Popup
                        // Show Buttons
                        // Im there / Got interrupted
                        // After click show "Done" button



                    }, {id: 'button1', 'data-status': 'ok'})
                ]
            });



            let customerList = me.$el.find('.customer-list');

            let acceptCustomerDiv = $('<div/>', {
                class:     'accept-customer-button',
                'data-id': customerID
            });

            let acceptCustomerButton = $('<input/>', {
                type:  'submit',
                name:  'accept-customer-button',
                value: 'Ich Übernehme!'
            });

            let atCustomerButton = $('<input/>', {
                type:  'submit',
                name:  'at-customer-button',
                value: 'Ich bin da!'
            });

            let cancelCustomerButton = $('<input/>', {
                type:  'submit',
                name:  'cancel-customer-button',
                value: 'Ich kann doch nicht!'
            });

            let finishCustomerButton = $('<input/>', {
                type:  'submit',
                name:  'finish-customer-button',
                value: 'Beratung beendet'
            });

            finishCustomerButton.click(() => {
                acceptCustomerDiv.remove();

                me.availableSwitch.get(0).checked = true;
                me.availableSwitch.change();
            });

            atCustomerButton.click(() => {
                atCustomerButton.hide();
                acceptCustomerDiv.append(finishCustomerButton);
                cancelCustomerButton.hide();

                me.websocketConnection.sendMessage(me.websocketConnection.messages.arrivedAtCustomer());
            });

            cancelCustomerButton.click(() => {
                acceptCustomerDiv.remove();

                me.availableSwitch.get(0).checked = false;
                me.availableSwitch.change();

                me.websocketConnection.sendMessage(me.websocketConnection.messages.cancelCustomer(customerID));
            });

            acceptCustomerButton.click(() => {
                me.websocketConnection.sendMessage(me.websocketConnection.messages.acceptCustomer(customerID));

                me.availableSwitch.get(0).checked = false;
                me.availableSwitch.change();

                acceptCustomerButton.hide();
                acceptCustomerDiv.append(atCustomerButton);
                acceptCustomerDiv.append(cancelCustomerButton);
            });

            acceptCustomerDiv.append(acceptCustomerButton);
            customerList.append(acceptCustomerDiv);
        },

        setState: function (state) {
            let me = this;

            me.state = state;

            if (state === true) {
                me.availableSwitch.css('color', '#00ff00');
            } else {
                me.availableSwitch.css('color', '#ff0000');
            }
        },

        toggleState: function (state) {
            let me = this;

            if (state === undefined) {
                me.setState(!me.state);
            } else {
                me.setState(state);
            }

            me.websocketConnection.sendMessage(me.websocketConnection.messages.setAvailable(me.state));
        },

        init: function () {
            let me = this;
            me.websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            me.availableSwitch = $('.entry--salesman-finder');
            me.availableSwitch.click(() => {
                me.toggleState();
            });

            me.websocketConnection.events.onStatus((data) => {
                me.setState(data['content']);
            });

            me.websocketConnection.events.onSellerRequested((data) => {
                let customerID = data['content'];
                this.createCustomer(customerID);
            });

            me.websocketConnection.events.onSellerRequestCanceled((data) => {
                let customerID = data['content'];

                let acceptCustomerDiv = me.$el.find('[data-id="' + customerID + '"]');

                if (acceptCustomerDiv.length === 0) {
                    return;
                }

                acceptCustomerDiv.remove();
                me.toggleState(true);
            });

            me.websocketConnection.events.onConnect(() => {
                me.availableSwitch.show();
            });

            me.websocketConnection.connect(me.websocketConnection.types.seller);

            me.websocketConnection.sendMessage(me.websocketConnection.messages.identify({
                'number': me.$el.find('.ost-consultant--badge').data('consultant-id')
            }));
            me.websocketConnection.sendMessage(me.websocketConnection.messages.getStatus());
        }
    });

    $(document).ready(() => {
        if ($('body').hasClass('is--consultant')) {
            $("body").ostSalesmanFinderSeller();
        }
    });

    // subscribe to loading emotions
    $.subscribe('plugin/swEmotionLoader/onLoadEmotionFinished', function () {

    })
})(jQuery);
