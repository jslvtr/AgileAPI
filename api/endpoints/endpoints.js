var configDB    = require('../config/database.js');
var HttpStatus  = require('http-status-codes');
var hat         = require('hat');
var parseMe       = require('../components/parse.js');

function endpointAdd(req, res, io)  {
    ///user/:owner/project/:project/endpoints
    var project = req.params.project;
    var owner = req.params.owner;
    var sessionUser = req.user;

    var room = '#' + project + '-' + owner;

    //Check if the user is a member of the project
    var query = 'select user_id from agile_api.project_members where user_id = ?';
    var params = [ sessionUser.username ];


    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
            if (err) {
                res.json(HttpStatus.METHOD_FAILURE, {
                    status: 420,
                    message: 'Cant find user.'
                });
            } else {
                if (result.rows[0].user_id == sessionUser.username)  {
                    var token_id = hat();
                    var title = req.body.title;
                    var description = req.body.description;
                    var url = req.body.url;
                    var headers_content = parseMe.toDatabaseFormat(req.body.headers);
                    var url_params = parseMe.toDatabaseFormat(req.body.url_params);
                    var method_type = req.body.method_type;
                    var body = ''+req.body.body;
                    var body_type = req.body.body_type;

                    var query       = 'insert into agile_api.endpoints (project_id, owner_id, token_id, title, description, url, headers, url_params, method_type, body, body_type, category_id) values (?,?,?,?,?,?,?,?, ?, ?, ?, ?) IF NOT EXISTS;';
                    var params      = [ project, owner, token_id, title, description, url, headers_content, url_params, method_type, body, body_type, 'main' ];

                    configDB.client.execute(query, params, {prepare : true, hints: ['String']}, function(err, result) {
                            if (err) {
                                io.emit(room, sessionUser.access_token, title, owner, 'Cant create endpoint.', null);

                                res.json(HttpStatus.METHOD_FAILURE, {
                                    status: 420,
                                    message: 'Cant create endpoint.'
                                });
                                console.log(err);
                            } else if (result.rows["0"]["[applied]"] === true) {
                                io.emit(room, sessionUser.access_token, title, owner, null, 'Endpoint ' + title + ' was added by ' + sessionUser.username);

                                res.json(HttpStatus.CREATED, {
                                    status  : 201,
                                    message : 'endpoint created',
                                    token   :   token_id
                                });
                            } else {
                                io.emit(room, sessionUser.access_token, title, owner, 'endpoint already exists.', null);

                                res.json(HttpStatus.NO_CONTENT, {
                                    status: 204,
                                    message: 'endpoint already exists.'
                                });
                            }
                        }
                    );
                }   else    {
                    res.json({message:"couldn't find you"});
                }
            }
        }
    );


}

function endpointGetAll(req, res)   {
    var project = req.params.project;
    var owner = req.params.owner;
    var sessionUser = req.user;

    //Check if the user is a member of the project
    var query = 'select user_id from agile_api.project_members where user_id = ?';
    var params = [ sessionUser.username ];


    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
            if (err) {
                res.json(HttpStatus.METHOD_FAILURE, {
                    status: 420,
                    message: 'Cant find user.'
                });
            } else {
                if (result.rows[0].user_id == sessionUser.username)  {
                    var query       = 'select * from agile_api.endpoints where project_id = ? and owner_id=? allow filtering;';
                    var params      = [ project, owner];

                    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
                        if (err) {
                            res.json(HttpStatus.METHOD_FAILURE, {
                                status: 420,
                                message: 'Can\'t find project.'
                            });
                            console.log(err);
                        }   else if (result.rows != null) {
                            var jsonResult = [];

                            for (var row in result.rows) {
                                jsonResult.push({
                                    token_id : result.rows[row].token_id,
                                    body : result.rows[row].body,
                                    body_type : result.rows[row].body_type,
                                    description : result.rows[row].description,
                                    headers : parseMe.toArrayFormat(result.rows[row].headers),
                                    method_type : result.rows[row].method_type,
                                    owner_id : result.rows[row].owner_id,
                                    project_id : result.rows[row].project_id,
                                    title : result.rows[row].title,
                                    url : result.rows[row].url,
                                    url_params : parseMe.toArrayFormat(result.rows[row].url_params),
                                    category    : result.rows[row].category_id
                                });
                            }
                            res.json(HttpStatus.OK, {
                                status: 200,
                                endpoints: jsonResult
                            });

                        }   else {
                            res.json(HttpStatus.NOT_FOUND , {
                                status: 404,
                                endpoint : "Project not found"
                            });
                        }
                    });
                }   else    {
                    res.json({message:"couldn't find you"});
                }
            }
        }
    );
}

function endpointGet(req, res)  {
    var project = req.params.project;
    var owner = req.params.owner;
    var token_id = req.params.id;
    var sessionUser = req.user;

    //Check if the user is a member of the project
    var query = 'select user_id from agile_api.project_members where user_id = ?';
    var params = [ sessionUser.username ];


    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
            if (err) {
                res.json(HttpStatus.METHOD_FAILURE, {
                    status: 420,
                    message: 'Cant find user.'
                });
            } else {
                if (result.rows[0].user_id == sessionUser.username)  {
                    var query       = 'select * from agile_api.endpoints where token_id=? allow filtering;';
                    var params      = [ token_id ];

                    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
                        if (err) {
                            res.json(HttpStatus.METHOD_FAILURE, {
                                status: 420,
                                message: 'Can\'t find Endpoint.'
                            });
                            console.log(err);
                        }   else if (result.rows != null) {
                            var jsonResult = [];

                            for (var row in result.rows) {
                                jsonResult.push({
                                    token_id : result.rows[row].token_id,
                                    body : result.rows[row].body,
                                    body_type : result.rows[row].body_type,
                                    description : result.rows[row].description,
                                    headers : parseMe.toArrayFormat(result.rows[row].headers),
                                    method_type : result.rows[row].method_type,
                                    owner_id : result.rows[row].owner_id,
                                    project_id : result.rows[row].project_id,
                                    title : result.rows[row].title,
                                    url : result.rows[row].url,
                                    url_params : parseMe.toArrayFormat(result.rows[row].url_params),
                                    category    : result.rows[row].category_id
                                });
                            }
                            res.json(HttpStatus.OK, {
                                status: 200,
                                endpoint: jsonResult[0]
                            });

                        }   else {
                            res.json(HttpStatus.NOT_FOUND , {
                                status: 404,
                                endpoint : "Endpoint not found"
                            });
                        }
                    });
                }   else    {
                    res.json({message:"Couldn't find Endpoint"});
                }
            }
        }
    );
}

function endpointUpdate(req, res, io)   {

    var project = req.params.project;
    var owner = req.params.owner;
    var token_id = req.params.id;
    var sessionUser = req.user;

    var room = '#' + project + '-' + owner;

    //Check if the user is a member of the project
    var query = 'select user_id from agile_api.project_members where user_id = ?';
    var params = [ sessionUser.username ];

    try {
        configDB.client.execute(query, params, {prepare: true}, function(err, result) {
                if (err) {
                    res.json(HttpStatus.METHOD_FAILURE, {
                        status: 420,
                        message: 'Cant find user.'
                    });
                } else {
                    if (result.rows[0].user_id == sessionUser.username)  {
                        var title = req.body.title;
                        var description = req.body.description;
                        var url = req.body.url;
                        var headers_content = parseMe.toDatabaseFormat(req.body.headers);
                        var url_params = parseMe.toDatabaseFormat(req.body.url_params);
                        var method_type = req.body.method_type;
                        var body = ''+req.body.body;
                        var body_type = req.body.body_type;
                        var category = req.body.category;

                        //project_id, owner_id, token_id, title, description, url, headers, url_params, method_type, body, body_type, category_id
                        var query       = 'update agile_api.endpoints set title = ? , description = ? , url = ? , headers = ? , url_params = ? , method_type = ? , body = ? , body_type = ? , category_id = ? where token_id = ?;';
                        var params      = [ title, description, url, headers_content, url_params, method_type, body, body_type, category, token_id ];

                        configDB.client.execute(query, params, {prepare: true}, function(err, result) {
                            if (err) {
                                res.json(HttpStatus.METHOD_FAILURE, {
                                    status: 420,
                                    message: 'Can\'t find Endpoint.'
                                });
                            }   else     {


                                io.emit(room, sessionUser.access_token, title, owner, null, 'Endpoint ' + title + ' was edited.');
                                res.json(HttpStatus.RESET_CONTENT);


                            }
                        });
                    }   else    {
                        res.json({message:"Couldn't find Endpoint"});
                    }
                }
            }
        );
    }   catch (err) {
        console.log("Error updating endpoint");
    }



}

function endpointDel(req, res, io)  {
    var project = req.params.project;
    var owner = req.params.owner;
    var token_id = req.params.id;
    var sessionUser = req.user;
    var room = '#' + project + '-' + owner;
    //Check if the user is a member of the project
    var query = 'select user_id from agile_api.project_members where user_id = ?';
    var params = [ sessionUser.username ];


    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
            if (err) {
                res.json(HttpStatus.METHOD_FAILURE, {
                    status: 420,
                    message: 'Cant find user.'
                });
            } else {
                if (result.rows[0].user_id == sessionUser.username)  {
                    var query       = 'delete from agile_api.endpoints where token_id=?';
                    var params      = [ token_id ];

                    configDB.client.execute(query, params, {prepare: true}, function(err, result) {
                            if (err) {
                                res.json(HttpStatus.METHOD_FAILURE, {
                                    status: 420,
                                    message: 'Can\'t delete endpoint.'
                                });
                            } else {
                                io.emit(room, sessionUser.access_token, project, owner, null, 'Endpoint ' + project + ' was deleted by ' + sessionUser.username);
                                res.json(HttpStatus.NO_CONTENT, {
                                    status: 204,
                                    message: 'Endpoint deleted'
                                });
                            }
                        }
                    );
                }   else    {
                    res.json({message:"couldn't find you"});
                }
            }
        }
    );
}



module.exports = {
    endpointAdd             :   endpointAdd,
    endpointGetAll          :   endpointGetAll,
    endpointGet             :   endpointGet,
    endpointUpdate          :   endpointUpdate,
    endpointDel             :   endpointDel
};