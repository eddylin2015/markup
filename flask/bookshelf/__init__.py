# Copyright 2015 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging

from flask import current_app, Flask, redirect, request, session, url_for
import httplib2
# [START include]
#from oauth2client.contrib.flask_util import UserOAuth2

import redis
pool=redis.ConnectionPool(host='127.0.0.1',port=6379)

from flask_session import Session
from .mySession import MySessionInterface
#oauth2 = UserOAuth2()
# [END include]


def create_app(config, debug=False, testing=False, config_overrides=None):
    
    app = Flask(__name__)
    app.config.from_object(config)

    app.debug = debug
    app.testing = testing

    if config_overrides:
        app.config.update(config_overrides)

    # Configure logging
    if not app.testing:
        logging.basicConfig(level=logging.INFO)

    # Setup the data model.
    with app.app_context():
        model = get_model()
        model.init_app(app)
    app.config['SESSION_COOKIE_NAME'] ="connect.sid"
    app.config['SESSION_TYPE'] = 'redis'  # session类型为redis
    app.config['SESSION_PERMANENT'] = False  # 如果设置为True，则关闭浏览器session就失效。
    app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
    app.config['SESSION_KEY_PREFIX'] = 'sess:'  # 保存到session中的值的前缀
    app.config['SESSION_REDIS'] = redis.Redis(host='127.0.0.1',port=6379)  
    
    
    app.session_interface = MySessionInterface()
    #Session(app)
    #se=Session
    #se.init_app(app)
    # [START init_app]
    # Initalize the OAuth2 helper.
    #oauth2.init_app(
    #    app,
    #    scopes=['email', 'profile'],
    #    authorize_callback=_request_user_info)
    #
       
        
    # [END init_app]

    # [START logout]
    # Add a logout handler.
    @app.route('/logout')
    def logout():
        # Delete the user's profile and the credentials stored by oauth2.
        del session['profile']
        session.modified = True
        #oauth2.storage.delete()
        return redirect(request.referrer or '/')
    # [END logout]


    # Register the Bookshelf CRUD blueprint.
    from .crud import crud
    app.register_blueprint(crud, url_prefix='/books')


    # Add a default root route.
    @app.route("/")
    def index():
        return redirect(url_for('crud.list'))
    
    @app.route("/sess")
    def showsess():    
        #s = json.dumps(session, indent=4, sort_keys=True)
        print ("*set session aa 1*")
        if (session['profile'] != None):
            if (session['profile'].get('aa') != None) :
               print(session['profile'].get('aa'))
               session["profile"]["aa"]= 1 + session["profile"].get("aa")
            else:
               session["profile"]["aa"]=0
        print(session)     
        print ("*2*")
        return str(session["profile"]["user"])

    @app.route("/profile")
    def showprofile():    
        #s = json.dumps(session, indent=4, sort_keys=True)
        print ("*profile 1*")
        print(session)     
        print ("*profile 2*")
        return str(session["profile"]["user"])
    # Add an error handler. This is useful for debugging the live application,
    # however, you should disable the output of the exception for production
    # applications.
    @app.errorhandler(500)
    def server_error(e):
        return """
        An internal error occurred: <pre>{}</pre>
        See logs for full stacktrace.
        """.format(e), 500

    return app
    

def get_model():
    from . import model_cloudsql
    model = model_cloudsql
    return model


# [START request_user_info]
def _request_user_info(credentials):
    """
    Makes an HTTP request to the Google+ API to retrieve the user's basic
    profile information, including full name and photo, and stores it in the
    Flask session.
    """
    csid= request.cookies["connect.sid"]
    mgetdata =session.session_interface.redis.mget(["sess:"+csid[4:csid.find(".")]])
    print( "req user info")
    print( mgetdata)
    if mgetdata is None:
        return 0
    if mgetdata[0] is None:
        return 0
    my_bytes_value = mgetdata[0]
    my_json = my_bytes_value.decode('utf8').replace("'", '"').replace("passport","profile")
    data = json.loads(my_json)        
    if data["profile"] is None:
        return 0
    res_contxt=data["profile"].get("user") or 0  
    return res_contxt
    session['profile'] = data

# [END request_user_info]
