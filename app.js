const request = require('request');
const express = require('express');
const q = require('q');
const cheerio = require('cheerio');

const app = express();
const http = require('http').Server(app);

http.listen(5500, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Listening to http://localhost:' + 5500);
})

app.get('/', (request, response) => {
    response.status(200).send('bar');
})

app.get('/scrape/:form_id', (request, response) => {
    scrapeGoogleFormForQuestions(request.params.form_id).then((questions) => {
        response.status(200).json(questions);
    }).catch((error) => {
        response.status(500).json(error);
    })
})

function scrapeGoogleFormForQuestions(form_id) {
    const promise = q.defer();
    request("https://docs.google.com/forms/d/" + form_id, (error, response, body) => {
        if (error) {
            promise.reject("Something went wrong");
        }
        else {
            var questions = extractQuestionsFromBody(body);
            if(questions)
            {
                promise.resolve(questions);  
            }
            else
            {
                promise.reject("Ah! I couldn't find the questions. Please make sure the link you shared is valid and you can access atleast one question on it.");
            }
        }
    })

    return promise.promise;
}

function extractQuestionsFromBody(htmlString) {
    var html = cheerio.load(htmlString);
    var questionSelectors = html(".freebirdFormviewerViewItemsItemItemTitle");
    if(!questionSelectors.length)
    {
        return false;
    }
    else
    {
        return extractQuestionsFromQuestionSelectors(questionSelectors);
    }
}

function extractQuestionsFromQuestionSelectors(questionSelectors) {
    var questions = [];
    questionSelectors.each(function(index, question) {
        questions.push(question.children[0].data);
    })
    return questions;
}