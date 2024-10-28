import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.connect.js';

class AccountController {
    async signup(req, res) {
        const {username, display_name,  email, password} = req.body;
        const user_role = 'user';
        try {
            const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if(user.rows.length > 0){
                return res.status(400).send('User already exists');
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.query('INSERT INTO users (username, display_name, email, password, user_role) VALUES ($1, $2, $3, $4, $5)', [username, display_name, email, hashedPassword, user_role]);
            res.status(201).send('User created');
            
        } catch (error) {
            res.status(500).send('Error: ' + error.message);
        }
    }
    async login(req, res) {
        const { username, password } = req.body;
        try{
            // Handle login here
            const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if(user.rows.length === 0){
                return res.status(400).send('User not found');
            }
            const validPassword = await bcrypt.compare(password, user.rows[0].password);
            const token = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username }, process.env.TOKEN_SECRET_KEY, {expiresIn: '24h'});
            if(validPassword){
                res.status(200).send({ auth: true, token: token });
            }
            else{
                res.status(400).send('Invalid password');
            }
        }
        catch(error){
            res.status(500).send('Error: ' + error.message);
        }
    }
}

export default new AccountController();