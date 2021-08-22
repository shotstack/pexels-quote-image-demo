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
        title: Joi.string().regex(/^[a-zA-Z0-9 ]*$/).min(0).max(60),
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

        const maxImages = 15;

        pexelsClient.search(data.search, maxImages, 1).then(function(pexels) {
            const styleMap = {
                style_1: {
                    borderUrl: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/borders/80s-acid-blue-square.png',
                    font: {
                        src: 'https://s3.ap-southeast-2.amazonaws.com/templates.shotstack.io/basic/asset/font/montserrat-black.ttf',
                        familyName: 'Montserrat Black',
                        color1: '#f4d400',
                        color2: '#4f4d00'
                    }
                },
                style_2: {
                    borderUrl: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/borders/80s-acid-green-square.png',
                    font: {
                        src: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/fonts/OpenSans-Regular.ttf',
                        familyName: "OpenSans",
                        color1: '#f1d101',
                        color2: '#1f1d10',
                    }
                },
                style_3: {
                    borderUrl: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/borders/80s-acid-pink-square.png',
                    font: {
                        src: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/fonts/LilitaOne-Regular.ttf',
                        familyName: "LilitaOne",
                        color1: '#f9d909',
                        color2: '#9f9d90',
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
                                css: `p { font-family: "${styleMap[data.style].font.familyName}"; color: ${styleMap[data.style].font.color1}; font-size: 64px; text-align: center; }`,
                                width: 600,
                                height: 600,
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
                                css: `p { font-family: "${styleMap[data.style].font.familyName}"; color: ${styleMap[data.style].font.color2}; font-size: 64px; text-align: center; }`,
                                width: 600,
                                height: 600,
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
                                src: pexels.photos[Math.floor(Math.random() * maxImages)].src.original,
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
            url: shotstackUrl + 'render/' + id + '?timeline=false',
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
