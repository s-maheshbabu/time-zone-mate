import java.io.*;
import java.util.*;
import static java.util.Map.Entry;

/*
Takes a file with entries like 
value1-1:key1
value1-2:key1
value2-1:key2

and creates a file like
key1=[value1-1, value1-2]
key2=[value2-1]
*/
public class HelloWorld{

     public static void main(String []args) {
        System.out.println("Hello World Buddy");
        
        Map<String,List<String>> map = new LinkedHashMap<>();
        
        try(BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
            for(String line; (line = br.readLine()) != null; ) {
                String[] parts = line.split(":");
                
                List<String> list = map.get(parts[1]);
                if(list == null) list = new ArrayList<String>();
                list.add(parts[0]);
                
                map.put(parts[1], list);
            }
        }
        catch(Exception ex) {
            System.out.println("An exception occurred: " + ex.getMessage());
        }
        
        try {
        PrintWriter writer = new PrintWriter("output.txt", "UTF-8");
        for(Map.Entry entry : map.entrySet()) {
            writer.println(entry);
        }
        writer.close();
        } catch(Exception ex){}

        
     }
}
