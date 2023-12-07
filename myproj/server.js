const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();

let currentUser = null;
let currPlayerID = 1106;
// Set up MySQL connection
const connection = mysql.createConnection({
  host: '35.224.38.200',
  user: 'root',
  password: 'Ishanvi1234',
  database: 'SportsUniverse2023'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'SportsUniverse: Your Ultimate Sports Companion' });
});

app.get('/athlete', (req, res) => {
  const { search } = req.query;

  if (!search) {
    connection.query('SELECT AthleteID, Name FROM athlete', (err, athletes) => {
      if (err) throw err;
      res.render('athletes1', { athletes, searchResults: [] });
    });
  } else {
    const searchQuery = '%' + search + '%'; 

    connection.query('SELECT AthleteID, Name FROM athlete WHERE Name LIKE ?', [searchQuery], (err, searchResults) => {
      if (err) throw err;
      res.render('athletes1', { athletes: [], searchResults: searchResults || [] });
    });
  }
});

app.get('/athlete/:id', (req, res) => {
  const athleteId = req.params.id;
  console.log('Athlete ID:', athleteId);

  // get athlete details based on ID
  connection.query('SELECT * FROM athlete WHERE AthleteID = ?', [athleteId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (result.length === 0) {
      res.status(404).send('Athlete not found');
      return;
    }

    res.render('athlete2', { athlete: result[0] });e
  });
});


app.get('/players', (req, res) => {
  const { search } = req.query;

  if (!search) {
    connection.query('SELECT DISTINCT FullName FROM batting_bowling_combined', (err, players) => {
      if (err) throw err;
      res.render('players', { players, searchResults: [], search });
    });
  } else {
    const searchQuery = '%' + search + '%';

    connection.query('SELECT DISTINCT FullName FROM batting_bowling_combined WHERE FullName LIKE ?', [searchQuery], (err, searchResults) => {
      if (err) throw err;
      res.render('players', { players: [], searchResults: searchResults || [], search });
    });
  }
});

app.get('/player/:name', (req, res) => {
  const playerName = req.params.name;

  connection.query('SELECT * FROM batting_bowling_combined WHERE FullName = ?', [playerName], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      res.status(404).send('Player not found');
      return;
    }

    res.render('player', { player: results[0], teams: results });
  });
});


app.get('/teams', (req, res) => {
  const { search } = req.query;

  if (!search) {
    connection.query('SELECT TeamID, NOC, Discipline FROM mytable', (err, teams) => {
      if (err) throw err;
      res.render('teams', { teams, searchResults: [] });
    });
  } else {
    const searchQuery = '%' + search + '%';

    connection.query('SELECT TeamID, NOC, Discipline FROM mytable WHERE NOC LIKE ? OR Discipline LIKE ?', [searchQuery, searchQuery], (err, searchResults) => {
    if (err) throw err;
      res.render('teams', { teams: [], searchResults: searchResults || [] });
    });
  }
});

app.get('/team/:id', (req, res) => {
  const teamId = req.params.id;
  connection.query('SELECT * FROM mytable WHERE TeamID = ?', [teamId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      res.status(404).send('Team not found');
      return;
    }

    res.render('team', { team: results[0] });
  });
});


app.get('/home', (req, res) => {
  res.redirect('http://35.209.213.54/');
});

app.get('/create-account', (req, res) => {
  res.render('create-account');
});

app.post('/process-account', (req, res) => {
  const { username } = req.body;

  const checkUsernameSQL = 'SELECT * FROM users WHERE username = ?';

  connection.query(checkUsernameSQL, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking username:', checkErr);
      res.sendStatus(500); 
      return;
    }

    // If username already exists, inform the user
    if (checkResults.length > 0) {
      res.send('Username is taken. Please choose another username.');
    } else {
      // If username is available, insert
      const updateSQL = 'INSERT INTO users (username) VALUES (?)';

      connection.query(updateSQL, [username], (updateErr, result) => {
        if (updateErr) {
          console.error('Error updating username:', updateErr);
          res.sendStatus(500); 
          return;
        }
        res.redirect('/');
      });
    }
  });
});

// login page route
app.get('/login', (req, res) => {
  res.render('login');
});

// Login form submission
app.post('/process-login', (req, res) => {
  const { username } = req.body;

  // Check if the username already exists
  const checkUsernameSQL = 'SELECT * FROM users WHERE username = ?';

  connection.query(checkUsernameSQL, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking username:', checkErr);
      res.sendStatus(500); // Internal Server Error
      return;
    }

    // If username already exists, inform the user
    if (checkResults.length > 0) {
      // If username is available, insert
      currentUser = username;
      console.log(currentUser);
      // Redirect
      res.redirect('http://35.209.213.54/');
    } else {
      // If username not in data
      res.send('Username does not exist. Please create an account.');
    }
  });
});

// logout
app.get('/logout', (req, res) => {
  // Set currentUser to null on logout
  currentUser = null;
  console.log(currentUser);
  res.redirect('http://35.209.213.54/');
});

app.get('/delete-account', (req, res) => {
  res.render('delete-account');
});

// deletion of the current user's account
app.post('/delete-account-process', (req, res) => {
  const username = currentUser;

  // Check if the username exists
  const checkUsernameSQL = 'SELECT * FROM users WHERE username = ?';

  connection.query(checkUsernameSQL, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking username:', checkErr);
      res.sendStatus(500); // Internal Server Error
      return;
    }

    // If username exists, delete
    if (checkResults.length > 0) {
      // Delete the user from the User table
      const deleteSQL = 'DELETE FROM users WHERE username = ?';

      connection.query(deleteSQL, [username], (deleteErr, result) => {
        if (deleteErr) {
          console.error('Error deleting account:', deleteErr);
          res.sendStatus(500); // Internal Server Error
          return;
        }

        currentUser = null; // Set currentUser to null after deletion
	console.log(currentUser);
        res.redirect('http://35.209.213.54/');
      });
    } else {
      // If username not found
      res.send('Username not found.');
    }
  });
});

app.get('/dashboard-button', (req, res) => {
  // Redirect to dashboard
  res.redirect('/dashboard');
});

app.get('/dashboard2-button', (req, res) => {
  // Redirect to the dashboard3 page
  res.redirect('/dashboard3');
});

app.get('/dashboard', (req, res) => {
  const year = 2023; 

  const query = `
    SELECT t.Teams, SUM(c.RunScore) AS TotalRuns
    FROM team t
    JOIN batting_bowling_combined c ON t.Teams = c.TeamName
    WHERE t.Year = ?
    GROUP BY t.Teams
    ORDER BY TotalRuns DESC
    LIMIT 3;
  `;

  connection.query(query, [year], (err, results) => {
    if (err) {
      console.error('Error fetching dashboard data:', err);
      res.sendStatus(500); // Internal Server Error
      return;
    }
    res.render('dashboard', { teams: results });
  });
});


app.get('/dashboard2', (req, res) => {
  var medalData;

  // get number of medals won per country
  connection.query('SELECT NOC, Gold, Silver, Bronze FROM countrymedal', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    medalData = result;

    console.log('Medal Data:', medalData);

    res.render('dashboard2', { medalData });
  });
});

app.get('/dashboard3', (req, res) => {
  const sqlQuery = `
  SELECT
      t.Year,
      t.Teams,
      t.Captain,
      COUNT(bbc.PlayerID) AS TotalPlayers,
      SUM(bbc.RunScore) AS TotalRunsScored,
      SUM(bbc.WicketsTaken) AS TotalWicketsTaken
  FROM team AS t
  LEFT JOIN batting_bowling_combined AS bbc ON t.Teams = bbc.TeamName
  GROUP BY t.Year, t.Teams, t.Captain
  ORDER BY t.Year
  LIMIT 15;
  `;

  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.render('dashboard3.ejs', { data: results });
  });
});

async function createTop3TeamsProcedure() {
  const stored_query = `
    CREATE PROCEDURE GetTop3Teams()
    BEGIN
        -- Get the top 3 teams by total runs for the specified year
        SELECT t.Teams, SUM(c.RunScore) AS TotalRuns
        FROM team t
        JOIN batting_bowling_combined c ON t.Teams = c.TeamName
        WHERE t.Year = 2023 -- Specify the desired season (e.g., 2023)
        GROUP BY t.Teams
        ORDER BY TotalRuns DESC
        LIMIT 3;
    END;
  `;

  try {
    await connection.promise().query(stored_query);
    console.log('Top 3 teams stored procedure created successfully!');
  } catch (error) {
    console.error('Error creating top 3 teams stored procedure:', error);
  }
}

// trigger function
async function createTop3TeamsTrigger() {
  const trigger_query = `
    CREATE TRIGGER Top3TeamsTrigger
    AFTER INSERT ON batting_bowling_combined
    FOR EACH ROW
    BEGIN
        -- Call the stored procedure to update top 3 teams
        CALL GetTop3Teams();
    END;
  `;

  try {
    await connection.promise().query(trigger_query);
    console.log('Top 3 teams trigger created successfully!');
  } catch (error) {
    console.error('Error creating top 3 teams trigger:', error);
  }
}


app.get('/add_player', (req, res) => {
  res.render('add_player');
});

// updating batting and bowling table
app.post('/update-table', (req, res) => {
  const { fullName, teamName, runScore, wicketsTaken, strikeRate, economyRate } = req.body;

  // Check if the player already exists in the table
  const checkPlayerSQL = 'SELECT * FROM batting_bowling_combined WHERE FullName = ?';

  connection.query(checkPlayerSQL, [fullName], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking player:', checkErr);
      res.sendStatus(500); // Internal Server Error
      return;
    }

    // If player already exists, inform the user
    if (checkResults.length > 0) {
      res.send('Player already exists. Please choose another player.');
    } else {
      // insert
      const insertPlayerSQL = 'INSERT INTO batting_bowling_combined (PlayerID, FullName, TeamName, RunScore, WicketsTaken, StrikeRate, EconomyRate) VALUES (?, ?, ?, ?, ?, ?, ?)';

      connection.query(
        insertPlayerSQL,
        [currPlayerID, fullName, teamName, runScore, wicketsTaken, strikeRate, economyRate],
        (insertErr, result) => {
          if (insertErr) {
            console.error('Error inserting player:', insertErr);
            res.sendStatus(500); // Internal Server Error
            return;
          }
          currPlayerID = currPlayerID + 1;
          console.log('Record inserted successfully');
          res.redirect('/players'); 
        }
      );
    }
  });
});

app.listen(80, () => {
  console.log('SportsUniverse app is running on port 80');
});
