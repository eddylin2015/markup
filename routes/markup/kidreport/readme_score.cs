using System;
using System.Collections.Generic;
using System.Collections;
using System.Linq;
using System.Text;
using MySql.Data.MySqlClient;
using System.Data;

namespace kscore
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            String classno = "I1A";
            if (args.Length > 0){ classno = args[0]; }
            String grade = classno.Substring(0,2);
            String[] grade_name = {"幼兒", "幼低", "幼高" };
            String[] class_name = {"信", "望", "愛", "善", "樂" };
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
            DataTable dt = GetStudMarkTableDataTable(conn,classno);
            Console.Write(Newtonsoft.Json.JsonConvert.SerializeObject(dt));
            conn.Close();
            conn.Dispose();
            Console.OutputEncoding = Encoding.Default;
        }
        static void wr_dt_json(DataTable dt)
        {
            Console.WriteLine("[");
            int cnt=0;
            foreach(DataRow row in dt.Rows){
            Console.WriteLine("{{id:{0}",cnt++);
            foreach(DataColumn dc in dt.Columns)
            {
                string tfn=dc.ColumnName; if(tfn.Length<3) tfn="T"+tfn;
                if(row.IsNull(dc)){ Console.WriteLine(",{0}:\"\"",tfn); }
				else
                    Console.WriteLine(",{0}:\"{1}\"",tfn,row[dc.ColumnName].ToString().Replace("\r","<br>"));
            }
            Console.WriteLine("},");
            }
            Console.WriteLine("{id:-1}]");
        }
        static DataTable GetStudMarkTableDataTable(MySqlConnection conn ,string class_no)
        {
            Hashtable field_names = new Hashtable();
            DataTable dt = new DataTable(class_no);
            DataColumn pkCol = dt.Columns.Add("Stud_ref", typeof(string));
            pkCol.MaxLength = 8;
            dt.PrimaryKey = new DataColumn[] { pkCol };
            dt.Columns.Add("Semester", typeof(int));
            dt.Columns.Add("seat", typeof(int));
            dt.Columns.Add("c_name", typeof(string)).MaxLength = 16;
            dt.Columns.Add("classno", typeof(string)).MaxLength = 16;
            dt.Columns.Add("term", typeof(string)).MaxLength = 32;
            dt.Columns.Add("PDate", typeof(string)).MaxLength = 16;
            dt.Columns.Add("honor1", typeof(string)).MaxLength = 124;
            dt.Columns.Add("honor2", typeof(string)).MaxLength = 124;
            dt.Columns.Add("honor3", typeof(string)).MaxLength = 124;
            dt.Columns.Add("honor4", typeof(string)).MaxLength = 124;
            dt.Columns.Add("honor5", typeof(string)).MaxLength = 124;
            dt.Columns.Add("reviews", typeof(string)).MaxLength = 256;
            dt.Columns.Add("later", typeof(string)).MaxLength = 125;
            dt.Columns.Add("upclass", typeof(string)).MaxLength = 125;
            int termid=0;
            int semester = 0;
            string PublishDate = "";
            string className = "";
            string term = "";
            using (MySqlDataReader dr = new MySqlCommand(String.Format("select classname from KClass Where classno='{0}' ;", class_no), conn).ExecuteReader())
            {
                while (dr.Read()){className = String.Format("{0}", dr[0]); }
            }
            using (MySqlDataReader dr = new MySqlCommand("select Term, Semester, PublishDate from ksetting", conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    PublishDate = dr[2].ToString();
                    termid = int.Parse(dr[0].ToString());
                    semester = int.Parse(dr[1].ToString());
                    string temp = "";
                    switch (semester)
                    {
                        case 0: temp = "上學期"; break;
                        case 1: temp = "下學期"; break;
                        case 2: temp = "暑期班"; break;
                    }
                    term = String.Format("{0}年度{1}", dr[0], temp);
                }
            }
            using (MySqlDataReader dr = new MySqlCommand(String.Format("select KCS_ID,Subject,KS_ID from KClassSubject Where classno='{0}' order by Tab;", class_no), conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    string fieldname = String.Format("{0}", dr[2]);
                    field_names.Add(dr[0].ToString(), fieldname);
                    dt.Columns.Add(fieldname, typeof(string)).MaxLength = 6;
                }
            }
            using (MySqlDataReader dr = new MySqlCommand(String.Format("select Stud_ref,curr_seat,c_name from studinfo Where curr_class='{0}' order by curr_seat;", class_no), conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    DataRow drow = dt.NewRow();
                    drow["Stud_ref"] =dr.IsDBNull(0) ? "" : dr[0].ToString();
                    drow["Semester"] = semester;
                    drow["seat"] = dr.IsDBNull(1) ? 0 : int.Parse(dr[1].ToString());
                    drow["c_name"] =dr.IsDBNull(2) ? "" : dr[2].ToString();
                    drow["classno"] = className;
                    drow["term"] = term;
                    drow["PDate"] = PublishDate;
                    dt.Rows.Add(drow);
                }
            }
            using (MySqlDataReader dr = new MySqlCommand(String.Format("select Stud_ref,KCS_ID,Grade from KstudSubject Where classno='{0}' and Semester='{1}'  and term='{2}' order by seat,kcs_id;",
                             class_no, semester, termid),conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    string stud_ref = dr.IsDBNull(0) ? "" :dr[0].ToString();
                    string fieldname = dr.IsDBNull(1) ? "" : field_names[dr[1].ToString()].ToString();
                    DataRow[] drow_s = dt.Select(String.Format("Stud_ref='{0}'", stud_ref));
                    drow_s[0][fieldname] =dr.IsDBNull(2) ? "" : dr[2].ToString();
                }
            }
            using (MySqlDataReader dr = new MySqlCommand(String.Format("select Stud_ref,reviews,later,upclass,honors from kstudreviews Where classno='{0}' and Semester='{1}'  and term='{2}' order by seat;", class_no, semester, termid), conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    string stud_ref = dr.IsDBNull(0) ? "" :dr[0].ToString();
                    //string fieldname = field_names[dr[1].ToString()].ToString();
                    DataRow[] drow_s = dt.Select(String.Format("Stud_ref='{0}'", stud_ref));
                    drow_s[0]["reviews"] =dr.IsDBNull(1) ? "" : dr[1].ToString();
                    drow_s[0]["later"] =dr.IsDBNull(2) ? "" : dr[2].ToString();
                    drow_s[0]["upclass"] =dr.IsDBNull(3) ? "" : dr[3].ToString();
                    char[] splitechars = new char[] { ',', '，' };
                    string[] honor_s = dr[4].ToString().Split(splitechars);
                    for (int i = 0; i < honor_s.Length; i++)
                    {
                        if (i > 5) break;
                        drow_s[0]["honor" + (i + 1)] = honor_s[i];
                    }
                }
            }
            if (dt.Rows.Count % 2 == 1) { DataRow drow = dt.NewRow(); drow["Stud_ref"] = "BLANK"; dt.Rows.Add(drow); }
           return dt;
        }
        static void wr_assess( MySqlConnection conn,String classno,string classname,string grade)
        {
            Console.Write("{");
            String sql = String.Format(@"SELECT ka_id,assess_date_stamp,assess_week_stamp,assess_days,topic,subtopic from kassesstopic where current_flag=1 and classno='{0}';",
                                        grade);
            String ka_id = "0";
            using (MySqlDataReader dr = new MySqlCommand(sql, conn).ExecuteReader())
            {
                while (dr.Read())
                {
                    ka_id = dr.GetString(0);
                    Console.Write("\"assdate\":\"{0}\",\"assweek\":\"{1}\",",dr.IsDBNull(1) ? "" : dr[1], dr.IsDBNull(2) ? "" :dr[2]);
                    Console.Write("\"assdays\":\"{0}\",\"asstopic\":\"{1}\",", dr.IsDBNull(3) ? "" :dr[3],dr.IsDBNull(4) ? "" : dr[4]);
                    Console.Write("\"asssubtopic\":\"{0}\",", dr.IsDBNull(5) ? "" :dr[5]);
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
                            term= settingdr.IsDBNull(0) ? "" :settingdr.GetString(0);
                            semester=settingdr.IsDBNull(1) ? "" : settingdr.GetString(1);
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
                        Console.Write("{{\"c_name\":\"{0}\",",dr.IsDBNull(2) ? "" : dr[2]);
                        Console.Write("\"classno\":\"{0}\",", classname);
                        Console.Write("\"seat\":\"{0}\",", dr.IsDBNull(1)? 0: dr[1]);
                        Console.Write("\"height\":\"{0}\",",dr.IsDBNull(3)?"": dr[3]);
                        Console.Write("\"weight\":\"{0}\"}}",dr.IsDBNull(4)?"": dr[4]);
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
                            if (ci < 4 && ci >0) cic = "class=c02";
                            Console.Write("<td class=c02><div {1}>{0}</div>\"", dr[1].ToString().Replace('"'.ToString(), "&quot;").Replace("\t", "").Replace("\r", "").Replace("\n", ""), cic);
                        }
                    }
                    dr.Close();
                    dr.Dispose();
                }
                Console.Write("]");
            }
            Console.Write("}");
        }
    }
}