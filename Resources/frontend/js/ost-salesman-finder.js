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
                customerIsGone: (id) => {
                    return {
                        'type': 'customer_is_gone',
                        'content': id
                    }
                },
                getStatus: () => {
                    return {
                        'type': 'get_status'
                    }
                }
            };

            this.events = {
                onConnect: (callback) => {
                    return this.addEventListener('onConnect', callback)
                },

                onClose: (callback) => {
                    return this.addEventListener('onClose', callback)
                },

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

            this.callEventListener = (event, data) => {
                if (Array.isArray(this.eventListeners[event])) {
                    this.eventListeners[event].forEach((callback) => callback(data));
                }
            };

            this.addEventListener = (event, callback) => {
                if (Array.isArray(this.eventListeners[event])) {
                    this.eventListeners[event].push(callback)
                } else {
                    this.eventListeners[event] = [callback];
                }
            };

            let buffer = [];
            this.send = (message) => {
                try {
                    this.connection.send(message);
                } catch (e) {
                    buffer.push(message);
                }
            };

            this.connect = (connectionType) => {
                this.connection = new WebSocket('ws://' + salesmanFinderConfig.webSocketPath + connectionType.path);

                let originalOnClose = this.connection.onclose;
                this.connection.onclose = (e) => {
                    if (e.code === 1000) {
                        console.log("WebSocket: closed");
                        this.callEventListener('onClose');
                    } else {
                        console.log("RECONNECT!");
                        this.connect(connectionType);
                    }

                    originalOnClose(e);
                };

                let originalOnError = this.connection.onerror;
                this.connection.onerror = (e) => {
                    if (e.code === 'ECONNREFUSED') {
                        console.log("RECONNECT!");
                        this.connect(connectionType);
                    } else {
                        originalOnError(e);
                    }
                };

                this.connection.onmessage = this.onMessage;

                this.connection.onopen = () => {
                    buffer.forEach((message) => {
                        this.send(message);
                    });

                    this.callEventListener('onConnect');
                };
            };

            this.onMessage = (message) => {
                let data = JSON.parse(message.data);

                this.callEventListener(data['type'], data);
            };

            this.sendMessage = (message) => {
                this.send(JSON.stringify(message))
            };

            if (salesmanFinderConfig.testMode === true) {
                this.connect = (connectionType) => {
                    console.log("Opening Connection with path " + connectionType.path);
                    this.callEventListener('onConnect');
                };

                window.salesmanFinderMessage = (data) => {
                    this.callEventListener(data.type, data);
                };

                this.sendMessage = function (message) {
                    console.log("Sent messsage: " + JSON.stringify(message))
                }
            }

            return this;
        }
    }
})(jQuery);
