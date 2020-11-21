import config


import pymysql.cursors

# This is only used when running locally. When running live, gunicorn runs
# the application.
if __name__ == '__main__':
    print (config)
    

    # Connect to the database
    connection = pymysql.connect(host=config.CLOUDSQL_HOST,
                                 user=config.CLOUDSQL_USER,
                                 password=config.CLOUDSQL_PASSWORD,
                                 db=config.CLOUDSQL_DATABASE,
                                 charset='utf8',
                                 cursorclass=pymysql.cursors.DictCursor)
    
    try:
        #with connection.cursor() as cursor:
        #    # Create a new record
        #    sql = "INSERT INTO `users` (`email`, `password`) VALUES (%s, %s)"
        #    cursor.execute(sql, ('webmaster@python.org', 'very-secret'))
        ## connection is not autocommit by default. So you must commit to save
        ## your changes.
        #connection.commit()
    
        with connection.cursor() as cursor:
            # Read a single record
            sql = "SELECT * FROM `es_user` WHERE `spk`=%s"
            cursor.execute(sql, ('1',))
            result = cursor.fetchone()
            print(result)
    finally:
        connection.close()