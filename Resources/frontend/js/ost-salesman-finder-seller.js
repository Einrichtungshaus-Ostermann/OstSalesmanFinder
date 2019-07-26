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

        /*
        modalContent: "<button id='salesman-finder--cancel'>Ich wurde aufgehalten</button>" +
            "<button id='salesman-finder--arrived'>Ich bin da!</button>" +
            "<button id='salesman-finder--customer-gone'>Kunde war schon weg</button>",
            */


        modalContent: '<img id="salesman-finder--arrived" src="http://inhouse-ost-5503/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--salesman--arrived.png" style=""><img id="salesman-finder--cancel" src="http://inhouse-ost-5503/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--salesman--delayed.png"><img id="salesman-finder--customer-gone" src="http://inhouse-ost-5503/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--salesman--gone.png">',
        modal: null,
        currentClient: null,
        notifications: {},

        acceptCustomer: function () {
            let me = this;

            me.toggleState(false);
            me.modal = $.modal.open(this.modalContent, {
                //width: 800,
                //height: 500,
                width: '100%',
                showCloseButton: false,
                closeOnOverlay: false,
                sizing: "content",
                additionalClass: "ost-salesman-finder--seller--actions"
            });

            $('#salesman-finder--cancel').click(() => {
                me.websocketConnection.sendMessage(me.websocketConnection.messages.cancelCustomer(me.currentClient.ID));
                me.modal.close();
                me.currentClient = null;
                me.modal = null;
            });

            $('#salesman-finder--arrived').click(() => {
                me.websocketConnection.sendMessage(me.websocketConnection.messages.arrivedAtCustomer());
                me.modal.close();
                me.currentClient = null;
                me.modal = null;
            });

            $('#salesman-finder--customer-gone').click(() => {
                me.websocketConnection.sendMessage(me.websocketConnection.messages.customerIsGone(me.currentClient.ID));
                me.modal.close();
                me.modal = null;
                me.currentClient = null;
                me.toggleState(true);
            });

            me.websocketConnection.sendMessage(me.websocketConnection.messages.acceptCustomer(me.currentClient.ID));
        },

        onSellerRequested: function (customer) {
            let me = this;

            try {
                fully.setAudioVolume(80, 5);
                fully.playSound("", true);
            } catch (e) {
            }

            let notification = new Noty({
                text: 'Dein Kunde wartet am Produktpiloten: ' + customer.division,
                closeWith: ['button'],
                progressBar: true,
                type: 'information',
                timeout: 1000 * 30,
                buttons: [
                    Noty.button('Ich bin auf dem Weg', 'btn btn-success', function () {
                        me.currentClient = customer;
                        me.acceptCustomer();

                        notification.close();
                    }, {id: 'okbutton', 'data-status': 'ok'})
                ],
                callbacks: {
                    onClose: function () {
                        delete me.notifications[customer.ID];

                        if (Object.keys(me.notifications).length === 0) {
                            try {
                                fully.stopSound();
                            } catch (e) {
                            }
                        }
                    }
                }
            });
            notification.show();

            me.notifications[customer.ID] = notification;
        },

        setState: function (state) {
            let me = this;

            me.state = state;

            if (state === true) {
                me.getSwitch().css('color', '#339900');
            } else {
                me.getSwitch().css('color', '#a12726');
            }
        },

        toggleState: function (state) {
            let me = this;

            if (state === undefined) {
                me.setState(!me.state);
            } else {
                me.setState(state);
            }

            if (me.state === false) {
                Object.keys(me.notifications).map(function (key) {
                    return me.notifications[key];
                }).forEach((notification) => {
                    notification.close();
                });
            }

            me.websocketConnection.sendMessage(me.websocketConnection.messages.setAvailable(me.state));
        },

        getSwitch: function () {
            return $('.entry--salesman-finder.icon--chat');
        },

        init: function () {
            let me = this;
            me.websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            me.getSwitch().click(() => {
                me.toggleState();
            });

            me.websocketConnection.events.onStatus((data) => {
                me.setState(data['content']);
            });

            me.websocketConnection.events.onSellerRequested((data) => {
                this.onSellerRequested(data['content']);
            });

            me.websocketConnection.events.onSellerRequestCanceled((data) => {
                let customerID = data['content'];

                if (this.currentClient !== null && this.currentClient.ID === customerID) {
                    this.modal.close();
                    me.toggleState(true);
                }

                if (this.notifications[customerID] !== undefined) {
                    this.notifications[customerID].close();
                }
            });

            me.websocketConnection.events.onConnect(() => {
                me.getSwitch().show();
            });

            me.websocketConnection.sendMessage(me.websocketConnection.messages.identify({
                'number': me.$el.find('.ost-consultant--badge').data('consultant-id').toString()
            }));


            window.onbeforeunload = function() {
                try {
                    fully.stopSound();
                } catch (e) {
                }

                if (Object.keys(me.notifications).length !== 0) {
                    return "Du hast noch unbeantwortet Anfragen!";
                }

                return;
            };

            window.addEventListener("beforeunload", function(e){

            }, false);

            me.websocketConnection.sendMessage(me.websocketConnection.messages.getStatus());

            me.websocketConnection.connect(me.websocketConnection.types.seller);
        }
    });

    $(document).ready(() => {
        if ($('body').hasClass('is--consultant')) {
            $("body").ostSalesmanFinderSeller();
        }
    });
})(jQuery);
