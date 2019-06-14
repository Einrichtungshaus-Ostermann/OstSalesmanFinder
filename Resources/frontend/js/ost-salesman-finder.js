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

    $.ostSalesmanFinder = {
        WebsocketConnection: function () {
            this.types = {
                'customer': {
                    path: '/customer'
                },
                'seller': {
                    path: '/seller'
                }
            };

            this.eventListeners = {};

            this.messages = {
                /** Global */
                getSellerCount: () => {
                    return {
                        'type': 'get_seller_count'
                    }
                },
                getAvailableSellerCount: () => {
                    return {
                        'type': 'get_available_seller_count'
                    }
                },
                identify: (data) => {
                    return {
                        'type': 'identify',
                        'content': data
                    }
                },

                /** Customer */
                requestSeller: () => {
                    return {
                        'type': 'request_seller'
                    }
                },
                cancelSellerRequest: () => {
                    return {
                        'type': 'cancel_seller_request'
                    }
                },

                /** Seller */
                setAvailable: (state) => {
                    return {
                        'type': 'set_available',
                        'content': state
                    }
                },
                acceptCustomer: (id) => {
                    return {
                        'type': 'accept_customer',
                        'content': id
                    }
                },
                cancelCustomer: (id) => {
                    return {
                        'type': 'cancel_customer',
                        'content': id,
                    }
                },
                arrivedAtCustomer: () => {
                    return {
                        'type': 'arrived_at_customer'
                    }
                },
                getStatus: () => {
                    return {
                        'type': 'get_status'
                    }
                }
            };

            this.events = {
                /** Global */
                onAvailableSellerCount: (callback) => {
                    return this.addEventListener('available_seller_count', callback);
                },
                onSellerCount: (callback) => {
                    return this.addEventListener('seller_count', callback);
                },
                onReset: (callback) => {
                    return this.addEventListener('reset', callback);
                },

                /** Customer */
                onSellerFound: (callback) => {
                    return this.addEventListener('seller_found', callback);
                },
                onSellerUnavailable: (callback) => {
                    return this.addEventListener('seller_unavailable', callback);
                },

                /** Seller */
                onSellerRequested: (callback) => {
                    return this.addEventListener('seller_requested', callback);
                },
                onSellerRequestCanceled: (callback) => {
                    return this.addEventListener('seller_request_canceled', callback);
                },
                onStatus: (callback) => {
                    return this.addEventListener('status', callback);
                }
            };

            this.addEventListener = (event, callback) => {
                if (Array.isArray(this.eventListeners[event])) {
                    this.eventListeners[event].push(callback)
                } else {
                    this.eventListeners[event] = [callback];
                }
            };

            this.connect = (connectionType) => {
                this.connection = new WebSocket('ws://' + document.location.host + ':8181' + connectionType.path);

                this.connection.onmessage = this.onMessage;

                let buffer = [];
                let realSend = this.connection.send;
                this.connection.onopen = () => {
                    this.connection.send = realSend;

                    buffer.forEach((message) => {
                        this.connection.send(message);
                    })
                };

                this.connection.send = (message) => {
                    buffer.push(message)
                }
            };

            this.onMessage = (message) => {
                let data = JSON.parse(message.data);

                if (this.eventListeners[data.type]) {
                    this.eventListeners[data.type].forEach((callback) => callback(data));
                }
            };

            this.sendMessage = (message) => {
                this.connection.send(JSON.stringify(message))
            };

            return this;
        }
    }

})(jQuery);
