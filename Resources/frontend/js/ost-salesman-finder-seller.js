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

        createCustomer: function (customerID) {
            let me = this;
            let customerList = me.$el.find('.customer-list');

            let acceptCustomerDiv = $('<div/>', {
                class: 'accept-customer-button',
                'data-id': customerID
            });

            let acceptCustomerButton = $('<input/>', {
                type: 'submit',
                name: 'accept-customer-button',
                value: 'Ich Übernehme!'
            });

            let atCustomerButton = $('<input/>', {
                type: 'submit',
                name: 'at-customer-button',
                value: 'Ich bin da!'
            });

            let cancelCustomerButton = $('<input/>', {
                type: 'submit',
                name: 'cancel-customer-button',
                value: 'Ich kann doch nicht!'
            });

            let finishCustomerButton = $('<input/>', {
                type: 'submit',
                name: 'finish-customer-button',
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

        init: function () {
            let me = this;
            me.websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            me.sellerAmount = me.$el.find('.seller-amount');
            me.websocketConnection.events.onAvailableSellerCount((data) => {
                let sellerCount = data['content'];

                me.sellerAmount.text(sellerCount + " Berater verfügbar")
            });

            me.availableSwitch = me.$el.find('#seller-available-switch');
            me.availableSwitch.change(() => {
                me.websocketConnection.sendMessage(me.websocketConnection.messages.setAvailable(me.availableSwitch.get(0).checked))
            });

            me.websocketConnection.events.onStatus((data) => {
                me.availableSwitch.get(0).checked = data['content'];
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
                me.availableSwitch.get(0).checked = true;
                me.availableSwitch.change();
            });

            me.websocketConnection.connect(me.websocketConnection.types.seller);
            me.websocketConnection.sendMessage(me.websocketConnection.messages.identify({
                'group': me.$el.data('group'),
                'name': me.$el.data('name'),
                'number': me.$el.data('number')
            }));
            me.websocketConnection.sendMessage(me.websocketConnection.messages.getAvailableSellerCount());
            me.websocketConnection.sendMessage(me.websocketConnection.messages.getStatus());
        }
    });

    // subscribe to loading emotions
    $.subscribe('plugin/swEmotionLoader/onLoadEmotionFinished', function () {
        $(".ost-salesman-finder-seller").ostSalesmanFinderSeller();
    })
})(jQuery);
