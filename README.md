                                                        # FeastFinder - Your Guide to Gastronomic Greatness
![alt text](image.png)

**Brief description of the project**

We are group 101 and our project is called FeastFinder. It is a dynamic recipe management system which combines cooking and web development. The project is driven by a two Flask servers (back end and front end) and uses the Spoonacular API for fetching recipes. Additionally, it leverages multiple custom made classes and functions to ensure persistance and enable CRUD operations. Using CSS, HTML, JavaScript and Bootstrap, our frontend provides a responsive and visually appealing UI, featuring interactive elements like cooking timers, brice breakdown plots, calorie filters and more. Through this project, we aimed to create a user-friendly and distinctive recipe application that elevates the cooking experience and reflects our passion towards both technology and culinary delights.

**Frontend mockup**
![alt text](image-1.png)

**Team members**

Márton Bodó

**Installation details**


**Architecture**

The repository for this project consists of 2 folders (back end, front end) and this README file.
The folder architecture can find bellow:

FeastFinder/
│
├── back-end/
│   ├── .env (API key)
│   ├── app.py (back end flask server)
│   |── favrecipes.py (custom class for creating recipe objects and implementing CRUD operations)
|   ├── myfavrecipes.json (json file to store favorite recipes (persistance))
│   ├── requirements.txt (necessary dependencies)
│      
│
│── front-end/
│    ├── static/
│    |   ├── css/
│    |   |    ├── add_fav.css (styles for the page where users can add their own favorite recipes)
│    |   |    ├── b3.jpg (background of the webapp)
│    |   |    ├── onefav.css (styles for the page where users can see a selected favorite recipes)
│    |   |    ├── recipe.css (styles for the page where users can see many recipes)
│    |   |    ├── singlerecipe.css (styles for the page where users can see a selected non favorite recipes)
│    |   |    ├── styles.css (general styles for the whole webapp)
│    |   |
│    |   |── js
│    |        ├── scripts.js (main js functions)
│    |
│    |
│    |── templates/
│    |        ├── addfav.html (html for the page where users can add their own favorite recipes)
│    |        ├── onefavourite.html (html for the page where users can see a selected favorite recipes)
│    |        ├── results.html (html for the page where users can see many non favorite recipes)
│    |        ├── onerecipe.html (html for the page where users can see a selected non favorite recipes)
│    |        ├── index.html (general html for the whole webapp - used for inheritance)
│    |        ├── test.html (html for the page where users can see many favorite recipes)
│    |        
│    ├── app.py (front end flask server)
│    ├── requirements.txt (necessary dependencies)
│
├── README
