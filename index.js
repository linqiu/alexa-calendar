require('any-promise/register')('bluebird', {Promise: require('bluebird')});
var _ = require('lodash');
var moment = require('moment');
var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var Promise = require('any-promise');
var Alexa = require('alexa-sdk');

var earliestDate = undefined;

var handlers = {
    'GetEarliestHoldingDate': function () {
        var text = 'You are not scheduled for holding any time soon.';

        if(earliestDate) {
            text = 'The next date you are in holding is ' + earliestDate;
        }

        this.emit(':tell', text);
    },
    'Unhandled': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that.');
    }
};

function getCalendar() {
        var params = {
            Key: {
                key: 'google-calendar'
            },
            TableName: 'home-integration'
        };

        return new Promise(function(resolve, reject) {
            dynamo.getItem(params, function(err, data) {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(data.Item);
                }
            });
        });
    }

exports.handler = function(event, context, callback) {
    getCalendar().then(function(item) {
        var alexa = Alexa.handler(event, context);
        alexa.appId = item.app_id;

        var iteratee = _.find(item.data, function(iteratee) {
            return iteratee.event.toLowerCase() == item.search_term;
        });

        earliestDate = iteratee ? moment(iteratee.time).format('dddd MMMM Do YYYY') : undefined;

        alexa.registerHandlers(handlers);
        alexa.execute();
    });
};