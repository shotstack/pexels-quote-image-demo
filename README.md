# Shotstack Motivational Quote Maker Demo

This project demonstrates how to use the Shotstack cloud video editing API to create 
an image using an HTML form and image sourced from the Pexels image library.

An HTML web form allows the user to search the Pexels library via the Pexels API, choose 
a style, and add a block of text. An image is the created by the Shotstack API using the images
returned by the Pexels search, and the track and text entered by the user.

View the live demo at: https://shotstack.io/demo/motivational-quote-maker/

The demo is built using Node.js and can be used with either Express Framework or deployed 
as a serverless projects using AWS Lambda and API Gateway.

### Requirements

- Node 12+
- Pexels API key: https://www.pexels.com/api
- Shotstack API key: https://dashboard.shotstack.io/register

### Project Structure

The project is divided in to a two components:

#### Backend API

The backend API with an endpoint which searches the Pexels API, prepares the edit and posts 
the data to the Shotstack API. A status endpoint is also available which can be polled to 
return the status of the image as it renders.

The backend API source code is in the _api_ directory.

#### Frontend Web Form & Player

The frontend is a simple HTML form that allows the user to enter a search term and basic 
options to create an image. The form uses jQuery to submit the data to the backend API and 
poll the status of the current render. There is also an image preview that is loaded with 
the final rendered image when ready.

The front end API source code is in the _web_ directory.

### Installation

Install node module dependencies:

```bash
cd api
npm install
```

### Configuration

Copy the .env.dist file and rename it .env. Replace the environment variables below with your
Pexels and Shotstack API key (staging key):

```bash
PEXELS_API_KEY=replace_with_your_pexels_key
SHOTSTACK_API_KEY=replace_with_your_shotstack_key
```

### Run Locally

To start the API and serve the front end form (from the _api_ directory):

```bash
cd api
npm run start
```

The visit [http://localhost:3000](http://localhost:3000)


### Deploy Serverless Application (optional)

The project has been built as a serverless application using the Serverless Framework 
and AWS Lambda. To understand more about the Serverless Framework and how to set 
everything up consult the documentation: https://serverless.com/framework/docs/providers/aws/

Lambda deployment uses a centralised S3 bucket which must be created first and the .env variable
`SERVERLESS_DEPLOYMENT_BUCKET_PREFIX` must be set. The serverless region is appended to the bucket prefix. The final
deployment bucket will look something like: my-serverless-deploys-ap-southeast-2

To deploy to AWS Lambda (from the _api_ directory):

```bash
cd api
npm run serverless
```

Once the API is deployed set the `var apiEndpoint` variable in **web/app.js** to the returned
API Gateway URL.

Run the **web/index.html** file locally or use AWS S3 static hosting to serve the web page.
