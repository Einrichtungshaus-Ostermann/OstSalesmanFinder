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

    let modalTemplate = '<div class="ost-salesman-finder-container ost-salesman-finder-customer" data-bunk="123" data-group="entwicklung"><div class="salesman-finder-headline"><p>Kein persönlicher Berater in Sichtweite?</p><p>Tippen sie auf den Servicebutton und einer unserer Mitarbeiter kommt sofort und kümmert sich um ihr Anliegen!</p></div><div class="request-seller-button"><input type="submit" name="request-seller-button" value="Berater rufen" id="request-seller-button"></div><div class="cancel-request-seller-button"><input type="submit" name="cancel-request-seller-button" value="Abbrechen" id="cancel-request-seller-button" style="display:none"></div></div>';

    // detail plugin
    $.plugin("ostSalesmanFinderCustomer", {

        init: function () {
            let me = this;
            let websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            me.requestButton = me.$el.find('#request-seller-button');
            me.cancelButton = me.$el.find('#cancel-request-seller-button');
            me.finderHeadline = me.$el.find('.salesman-finder-headline');

            me.timer = null;

            me.reset = () => {
                me.requestButton.show();
                me.cancelButton.hide();
                me.requestButton.val("Berater rufen");
                me.finderHeadline.html("<p>Kein persönlicher Berater in Sichtweite?</p><p>Tippen sie auf den Servicebutton und einer unserer Mitarbeiter kommt sofort und kümmert sich um ihr Anliegen!</p>")
            };

            websocketConnection.events.onReset(() => {
                me.reset();
            });

            me.cancelButton.click(() => {
                websocketConnection.sendMessage(websocketConnection.messages.cancelSellerRequest());
                me.reset();
            });

            me.requestButton.click(() => {
                websocketConnection.sendMessage(websocketConnection.messages.requestSeller());

                if (me.timer !== null) {
                    clearTimeout(me.timer);
                }

                me.requestButton.hide();
                me.cancelButton.show();
                me.finderHeadline.html("<p>Ein Berater in der Nähe wird gesucht.</p>");

                me.timer = setTimeout(() => {
                    me.finderHeadline.html("<p>Sorry, aktuell ist kein Verkäufer sofort Verfügbar.</p>");
                    me.requestButton.val("Nochmal versuchen");
                    me.requestButton.show();
                    me.cancelButton.hide();

                    me.timer = setTimeout(me.reset, 10 * 1000);
                }, 30 * 1000);
            });

            websocketConnection.events.onSellerUnavailable(() => {
                me.cancelButton.show();
                me.finderHeadline.html("<p>Der Berater ist leider nicht mehr Verfügbar. Ein alternativer Berater in der Nähe wird gesucht.</p>");

                me.timer = setTimeout(() => {
                    websocketConnection.sendMessage(websocketConnection.messages.cancelSellerRequest());
                    me.finderHeadline.html("<p>Sorry, aktuell ist kein Verkäufer sofort Verfügbar.</p>");
                    me.requestButton.val("Nochmal versuchen");
                    me.requestButton.show();
                    me.cancelButton.hide();

                    me.timer = setTimeout(me.reset, 10 * 1000);
                }, 30 * 1000);
            });

            websocketConnection.events.onSellerFound((data) => {
                let seller = data['content'];

                me.cancelButton.hide();

                me.$el.find('.salesman-finder-headline').html("<p>" + seller.name + " wird Sie gleich beraten. Er ist in wenigen Augenblicken für sie da!</p>");
                clearTimeout(me.timer);
            });

            websocketConnection.connect(websocketConnection.types.customer);
            websocketConnection.sendMessage(websocketConnection.messages.identify({
                'group': me.$el.data('group'),
                'bunk': me.$el.data('bunk')
            }));
        }
    });

    $.subscribe('plugin/swModal/onOpen', function () {
        $(".ost-salesman-finder-customer").ostSalesmanFinderCustomer();
    });


    if (window.sessionStorage.getItem("disable-seller-popup") !== "true") {
        setTimeout(() => {
            $.modal.open(modalTemplate, {
                title: 'Verkäufer Finder'
            });

            window.sessionStorage.setItem("disable-seller-popup", "true");
        }, 10 * 1000);
    }


    // subscribe to loading emotions
    $.subscribe('plugin/swEmotionLoader/onLoadEmotionFinished', function () {
        $(".ost-salesman-finder-customer").ostSalesmanFinderCustomer();
    })
})(jQuery);
