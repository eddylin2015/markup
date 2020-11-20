using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using MySql.Data.MySqlClient;


namespace kassess
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.Write("{");
            String classno = "I1A";
            if (args.Length > 0)
            {
                classno = args[0];
            }
            String grade = classno.Substring(0,2);
            String[] grade_name = {"幼兒","幼低","幼高" };
            String[] class_name = { "信", "望", "愛","善","樂" };
            String classname = "";
            switch (grade)
            {
                case "I1": classname = grade_name[0]; break;
                case "I2": classname = grade_name[1]; break;
                case "I3": classname = grade_name[2]; break;
                 default:
                    break;
            }
            switch (classno.Substring(2, 1))
            {
                case "A": classname += class_name[0]; break;
                case "B": classname += class_name[1]; break;
                case "C": classname += class_name[2]; break;
                case "D": classname += class_name[3]; break;
                case "E": classname += class_name[4]; break;
                default:
                    classname = classno;
                    break;
            }
            MySqlConnection conn = new MySql.Data.MySqlClient.MySqlConnection("");
            conn.Open();
            String sql = String.Format(@"SELECT ka_id,assess_date_stamp,assess_week_stamp,assess_days,topic,subtopic from kassesstopic where current_flag=1 and classno='{0}';", grade);
            String ka_id = "0";
            using (MySqlDataReader dr = new MySqlCommand(sql, conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    ka_id = dr.GetString(0);
                    Console.Write("\"assdate\":\"{0}\",\"assweek\":\"{1}\",", dr[1], dr[2]);
                    Console.Write("\"assdays\":\"{0}\",\"asstopic\":\"{1}\",", dr[3], dr[4]);
                    Console.Write("\"asssubtopic\":\"{0}\",", dr[5]);
                }
                dr.Close();
                dr.Dispose();
            }
            Console.Write("\"stud\":[");
            {
                String semester="";String term="";
                {
                    using (MySqlDataReader settingdr = new MySqlCommand(@"SELECT term ,semester from ksetting", conn).ExecuteReader())
                   {
                        while (settingdr.Read())
                        {
                            
                            term= settingdr.GetString(0);
                            semester= settingdr.GetString(1);
                        }
                        settingdr.Close();
                        settingdr.Dispose();
                    }
                }
                int c = 0;
                String sql0 = String.Format(
@"select curr_class,curr_seat,a.c_name,height,weight 
from studinfo a left join Kstudbodychecking b on a.stud_ref=b.stud_ref  
where curr_class='{0}' and b.classno='{0}' and b.term='{1}' and semester={2}  order by curr_class,curr_seat;
", classno,term,semester);
                using (MySqlDataReader dr = new MySqlCommand(sql0, conn).ExecuteReader())
                {
                    while (dr.Read())
                    {
                        c++;
                        if (c > 1) Console.Write(",");
                        Console.Write("{{\"c_name\":\"{0}\",", dr[2]);
                        Console.Write("\"classno\":\"{0}\",", classname);
                        Console.Write("\"seat\":\"{0}\",", dr[1]);
                        Console.Write("\"height\":\"{0}\",", dr[3]);
                        Console.Write("\"weight\":\"{0}\"}}", dr[4]);
                    }
                    dr.Close();
                    dr.Dispose();
                }
                Console.Write("],");
            }
            Console.Write("\"topic\":[");
            {
                String sql0 = String.Format("select subject,item from kassesstopic_subjectitem where ka_id={0} order by s_no,si_no;", ka_id);
                using (MySqlDataReader dr = new MySqlCommand(sql0, conn).ExecuteReader())
                {
                    int c = 0;
                    string t="";
                    while (dr.Read())
                    {
                        c++;
                        if (c > 1) Console.Write(",");
                        if (c > 1 && !t.Equals(dr.GetString(0))) { Console.Write("\"<tr><td class=c01>{0}\",", "&nbsp;"); }
                        if (t.Equals(dr.GetString(0))) { Console.Write("\"<tr><td class=c01>{0}", ""); }
                        else
                        {
                            Console.Write("\"<tr><td class=c01>{0}:", dr[0]);
                            t = dr.GetString(0);
                        }
                        if(dr.IsDBNull(1))
                        {
                            Console.Write("<td class=c02>{0}\"", "");
                        }else{
                            int ci=dr[1].ToString().IndexOf('.');
                            String cic = "";
                            if (ci < 4 && ci >0) cic = "class=c0"+ci;
                            Console.Write("<td class=c02><div {1}>{0}</div>\"", dr[1].ToString().Replace('"'.ToString(), "&quot;").Replace("\t", "").Replace("\r", "").Replace("\n", ""), cic);
                        }
                    }
                    dr.Close();
                    dr.Dispose();
                }
                Console.Write("]");
            }
            conn.Close();
            conn.Dispose();
            Console.Write("}");
            Console.OutputEncoding = Encoding.Default;
        }
    }
}