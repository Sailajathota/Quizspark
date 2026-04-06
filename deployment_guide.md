# QuizSpark Deployment Guide

This guide will walk you through deploying your entire QuizSpark application from scratch. We will set up your database on **MongoDB Atlas**, deploy your backend to **Railway**, and finally host your frontend on **Vercel**.

---

## Step 1: Set Up MongoDB Atlas

Your backend needs a database to store custom quizzes and results. We will use MongoDB Atlas, a free cloud-hosted MongoDB service.

1. **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Create a Cluster**: 
   - Choose the **M0 Free** tier.
   - Select your preferred cloud provider (AWS, Google Cloud, or Azure) and a region close to you.
   - Click **Create Cluster**.
3. **Database Access**: 
   - Once your cluster is ready, go to **Database Access** under the "Security" section in the left sidebar.
   - Click **Add New Database User**.
   - Create a username and a strong password. **Write these down; you will need them shortly!**
4. **Network Access**:
   - Go to **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (this sets it to `0.0.0.0/0`) so Railway can connect. Confirm and save.
5. **Get Your Connection String**:
   - Go back to **Database** (under "Deployment").
   - Click **Connect** on your cluster.
   - Choose **Connect your application**.
   - Copy the connection string. It will look something like this:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - **Important:** Replace `<username>` and `<password>` with the credentials you created in step 3. 

---

## Step 2: Deploy Backend to Railway

Railway will host your Node.js/Socket.io backend. It will connect to your MongoDB database using the URL you just grabbed.

1. **Push Code to GitHub**: Ensure your `Quizspark` project is pushed to a Github repository.
2. **Setup Railway Account**: Go to [Railway.app](https://railway.app/) and sign up with your GitHub account.
3. **Create a New Project**:
   - Click **New Project** -> **Deploy from GitHub repo**.
   - Select your `Quizspark` repository.
4. **Configure the Project**:
   - Railway might detect the entire repo. We need to tell it to only build the `backend` folder.
   - Click on the deployed service card -> **Settings**.
   - Scroll down to **Root Directory** and type `backend`. Click checkmark to save.
5. **Set Environment Variables**:
   - Switch to the **Variables** tab for your backend service.
   - Click **New Variable**.
   - **Name**: `PORT`
   - **Value**: `3001` (or let Railway auto-assign standard ports, but `PORT` is usually good).
   - Click **New Variable** again.
   - **Name**: `MONGODB_URI`
   - **Value**: Paste your MongoDB connection string from Step 1.
6. **Generate a Public URL**:
   - Go to the **Settings** tab.
   - Scroll down to **Networking** -> **Public Networking**.
   - Click **Generate Domain**.
   - **Copy this domain URL** (e.g., `https://quizspark-backend-production.up.railway.app`). You will need this for the frontend!

*(Note: Your backend code already includes a `railway.json` which helps Railway identify how to start your app. Wait a few minutes for the fresh build to complete.)*

---

## Step 3: Deploy Frontend to Vercel

Vercel will host your React frontend and needs to know how to talk to the backend you just deployed on Railway.

1. **Setup Vercel Account**: Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2. **Create a New Project**:
   - Click **Add New...** -> **Project**.
   - Import your `Quizspark` GitHub repository.
3. **Configure the Project**:
   - In the configuration screen, look for **Root Directory**.
   - Click **Edit** and select the `frontend` folder.
   - Ensure the Framework Preset is set to **Vite**.
4. **Set Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add a new variable:
     - **Name**: `VITE_BACKEND_URL`
     - **Value**: Paste the Railway URL you copied in Step 2. *(Ensure there is NO trailing slash at the end, e.g., `https://your-app-domain.up.railway.app`)*.
5. **Deploy**:
   - Click the **Deploy** button.
   - Vercel will install dependencies, build the frontend, and provide you with a live, shareable link!

---

## 🚀 You're Live!

You can now visit the Vercel link to use QuizSpark. Hosts can create custom quizzes (which will be saved to MongoDB) and start live sessions. Players can join using the automatically generated game PINs.
