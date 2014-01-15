/**
 * @author Kyle Florence <kyle[dot]florence[at]gmail[dot]com>
 * @website https://github.com/kflorence/jquery-deserialize/
 * @version 1.2.1
 *
 * Dual licensed under the MIT and GPLv2 licenses.
 */
(function( $, undefined ) {

    var push = Array.prototype.push,
        rcheck = /^(?:radio|checkbox)$/i,
        rplus = /\+/g,
        rselect = /^(?:option|select-one|select-multiple)$/i,
        rvalue = /^(?:button|color|date|datetime|datetime-local|email|hidden|month|number|password|range|reset|search|submit|tel|text|textarea|time|url|week)$/i;

    function getElements( elements ) {
        return elements.map(function() {
                return this.elements ? $.makeArray( this.elements ) : this;
            }).filter( ":input:not(:disabled)" ).get();
    }

    function getElementsByName( elements ) {
        var current,
            elementsByName = {};

        $.each( elements, function( i, element ) {
            current = elementsByName[ element.name ];
            elementsByName[ element.name ] = current === undefined ? element :
                ( $.isArray( current ) ? current.concat( element ) : [ current, element ] );
        });

        return elementsByName;
    }

    function flatObjTick(data, name, res) {
        var isObject = $.isPlainObject(data),
            isArray = $.isArray(data);

        if (isObject || isArray) {
            $.each(data, function(prop, value) {
                if (isObject) {
                    var pname = !name.length ? name + prop : name + '[' + prop + ']';
                    flatObjTick(value, pname, res);
                }
                else if (isArray && !$.isPlainObject(value)) {
                    flatObjTick(value, name, res);
                }
            });
        }
        else {
            if (res[name]) {
                if (!$.isArray(res[name])) {                
                    res[name] = [res[name]]
                }
                res[name].push(data);
                return;
            }
            res[name] = data;
        }
    }

    function flatObj(data) {
        var res = {};
        flatObjTick(data, '', res);
        return res;
    }

    $.fn.deserialize = function( data, options ) {
        var i, length,
            elements = getElements( this ),
            normalized = [];

        if ( !data || !elements.length ) {
            return this;
        }

        if ( $.isArray( data ) ) {
            normalized = data;

        } else if ( $.isPlainObject( data ) ) {
            var key, value, flatData = flatObj(data);

            $.each(flatData, function(key, value) {
                if ($.isArray(value)) {
                    push.apply( normalized, $.map( value, function( v ) {
                        return { name: key, value: v };
                    }));
                }
                else {
                    push.call( normalized, { name: key, value: value } );
                }
            });

        } else if ( typeof data === "string" ) {
            var parts;

            data = data.split( "&" );

            for ( i = 0, length = data.length; i < length; i++ ) {
                parts =  data[ i ].split( "=" );
                push.call( normalized, {
                    name: decodeURIComponent( parts[ 0 ] ),
                    value: decodeURIComponent( parts[ 1 ].replace( rplus, "%20" ) )
                });
            }
        }

        if ( !( length = normalized.length ) ) {
            return this;
        }

        var current, element, j, len, name, property, type, value,
            change = $.noop,
            complete = $.noop,
            names = {};

        options = options || {};
        elements = getElementsByName( elements );

        // Backwards compatible with old arguments: data, callback
        if ( $.isFunction( options ) ) {
            complete = options;

        } else {
            change = $.isFunction( options.change ) ? options.change : change;
            complete = $.isFunction( options.complete ) ? options.complete : complete;
        }

        for ( i = 0; i < length; i++ ) {
            current = normalized[ i ];

            name = current.name;
            value = current.value;

            if ( !( element = elements[ name ] ) ) {
                continue;
            }

            type = ( len = element.length ) ? element[ 0 ] : element;
            type = ( type.type || type.nodeName ).toLowerCase();
            property = null;

            if ( rvalue.test( type ) ) {
                if ( len ) {
                    j = names[ name ];
                    element = element[ names[ name ] = ( j == undefined ) ? 0 : ++j ];
                }

                change.call( element, ( element.value = value ) );

            } else if ( rcheck.test( type ) ) {
                property = "checked";

            } else if ( rselect.test( type ) ) {
                property = "selected";
            }

            if ( property ) {
                if ( !len ) {
                    element = [ element ];
                    len = 1;
                }

                for ( j = 0; j < len; j++ ) {
                    current = element[ j ];

                    if ( current.value == value ) {
                        change.call( current, ( current[ property ] = true ) && value );
                    }

                }
            }
        }

        complete.call( this );

        return this;
    };

})( jQuery );