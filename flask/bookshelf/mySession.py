import uuid
import json
from flask.sessions import SessionInterface
from flask.sessions import SessionMixin
from itsdangerous import Signer, BadSignature, want_bytes


class MySession(dict, SessionMixin):
    def __init__(self, initial=None, sid=None):
        self.sid = sid
        self.initial = initial
        super(MySession, self).__init__(initial or ())

    def __setitem__(self, key, value):
        super(MySession, self).__setitem__(key, value)

    def __getitem__(self, item):
        return super(MySession, self).__getitem__(item)

    def __delitem__(self, key):
        super(MySession, self).__delitem__(key)


class MySessionInterface(SessionInterface):
    session_class = MySession
    container = {}

    def __init__(self):
        import redis
        self.redis = redis.Redis()       

    def _generate_sid(self):
        return None

    def _get_signer(self, app):
        return None
   
    def open_session(self, app, request):
        csid = request.cookies.get(app.session_cookie_name)
        if csid  is None:
            csid = self._generate_sid()
            return self.session_class(sid=csid)
        sid=csid[4:csid.find(".")]
        list = ["sess:"+sid]
        my_bytes_value = self.redis.mget(list)[0]
        if my_bytes_value is None:
            return self.session_class(sid=csid)
        my_json = my_bytes_value.decode('utf8').replace("'", '"').replace("passport", 'profile')
        #print(my_json)
        #print('- ' * 20)
        dict = json.loads(my_json)
        return self.session_class(dict, sid=sid)

    def save_session(self, app, session, response):
        val = json.dumps(dict(session))
        #keydict = {}
        #keydict['sess:'+session.sid] = val
        #self.redis.mset(keydict)
