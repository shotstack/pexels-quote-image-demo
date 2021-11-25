'use strict';

const request = require('request');
const Joi = require('@hapi/joi');
const PexelsAPI = require('pexels-api-wrapper');
const pexelsClient = new PexelsAPI(process.env.PEXELS_API_KEY);
const shotstackUrl = process.env.SHOTSTACK_HOST;
const shotstackApiKey = process.env.SHOTSTACK_API_KEY;

module.exports.submit = (data) => {
    const schema = {
        search: Joi.string().regex(/^[a-zA-Z0-9 ]*$/).min(2).max(30).required(),
        title: Joi.string().min(1).max(100).required(),
        style: Joi.string().valid(['style_1', 'style_2', 'style_3']).required(),
    };

    const valid = Joi.validate(
        {
            search: data.search,
            style: data.style,
            title: data.title,
        },
        schema
    );

    return new Promise((resolve, reject) => {
        if (valid.error) {
            return reject(valid.error);
        }

        const MAX_RESULTS = 15;

        pexelsClient.search(data.search, MAX_RESULTS, 1).then(function(pexels) {
            if (pexels.total_results === 0) {
                throw "No image found for '" + data.search + "', please try a different keyword.";
            }

            const maxResults = Math.min(pexels.total_results, MAX_RESULTS);

            const styleMap = {
                style_1: {
                    borderUrl: 'https://templates.shotstack.io/basic/asset/image/border/dots-curls/square/1080-white.png',
                    font: {
                        src: 'https://templates.shotstack.io/basic/asset/font/rye-regular.ttf',
                        familyName: 'Rye',
                        color1: '#ffffff',
                        color2: '#33555555',
                        size: '64px',
                        lineHeight: '100',
                    }
                },
                style_2: {
                    borderUrl: 'https://templates.shotstack.io/basic/asset/image/border/tape-scratches/square/1080-white.png',
                    font: {
                        src: 'https://templates.shotstack.io/basic/asset/font/specialelite-regular.ttf',
                        familyName: 'Special Elite',
                        color1: '#ffffff',
                        color2: '#cc333333',
                        size: '68px',
                        lineHeight: '135',
                    }
                },
                style_3: {
                    borderUrl: 'https://templates.shotstack.io/basic/asset/image/border/rough-frame-dots/square/1080-white.png',
                    font: {
                        src: 'https://templates.shotstack.io/basic/asset/font/homemadeapple-regular.ttf',
                        familyName: "Homemade Apple",
                        color1: '#ffffff',
                        color2: '#33555555',
                        size: '54px',
                        lineHeight: '80',
                    }
                },
            };
            const tracks = [
                {
                    clips: [
                        {
                            asset: {
                                type: 'html',
                                html: `<p>${data.title}</p>`,
                                css: `p { font-family: "${styleMap[data.style].font.familyName}"; color: ${styleMap[data.style].font.color1}; font-size: ${styleMap[data.style].font.size}; line-height: ${styleMap[data.style].font.lineHeight}; text-align: center; }`,
                                width: 640,
                                height: 640,
                                background: 'transparent',
                            },
                            start: 0,
                            length: 1,
                        },
                    ],
                },
                {
                    clips: [
                        {
                            asset: {
                                type: 'html',
                                html: `<p>${data.title}</p>`,
                                css: `p { font-family: "${styleMap[data.style].font.familyName}"; color: ${styleMap[data.style].font.color2}; font-size: ${styleMap[data.style].font.size}; line-height: ${styleMap[data.style].font.lineHeight}; text-align: center; }`,
                                width: 640,
                                height: 640,
                                background: 'transparent',
                            },
                            start: 0,
                            length: 1,
                            offset: {
                                x: 0.004,
                                y: -0.004,
                            },
                        },
                    ],
                },
                {
                    clips: [
                        {
                            asset: {
                                type: 'image',
                                src: styleMap[data.style].borderUrl,
                            },
                            start: 0,
                            length: 1,
                        },
                    ],
                },
                {
                    clips: [
                        {
                            asset: {
                                type: 'image',
                                src: pexels.photos[Math.floor(Math.random() * maxResults)].src.original,
                            },
                            start: 0,
                            length: 1,
                        },
                    ],
                },
            ];

            const timeline = {
                background: '#000000',
                fonts: [
                    {
                        src: styleMap[data.style].font.src,
                    },
                ],
                tracks: tracks,
            };

            const output = {
                format: 'jpg',
                quality: 'high',
                size: {
                    width: 1000,
                    height: 1000,
                },
            };

            const edit = {
                timeline: timeline,
                output: output
            };

            request({
                url: shotstackUrl + 'render',
                method: 'POST',
                headers: {
                    'x-api-key': shotstackApiKey
                },
                json: true,
                body: edit
            }, function (error, response, body){
                if (error) {
                    console.log(error);
                    return reject(error);
                }

                return resolve(body.response);
            });
        }).catch(function(error) {
            console.log(error);
            return reject(error);
        });
    });
};

module.exports.status = (id) => {
    const schema = {
        id: Joi.string().guid({
            version: [
                'uuidv4',
                'uuidv5'
            ]
        })
    };

    const valid = Joi.validate({
        id: id
    }, schema);

    return new Promise((resolve, reject) => {
        if (valid.error) {
            return reject(valid.error);
        }

        request({
            url: shotstackUrl + 'render/' + id,
            method: 'GET',
            headers: {
                'x-api-key': shotstackApiKey
            },
            json: true
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                return reject(error);
            }

            return resolve(body.response);
        });
    });
};
