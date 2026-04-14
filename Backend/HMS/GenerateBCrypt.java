import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateBCrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String password = "password123";
        String hashed = encoder.encode(password);
        System.out.println("Password: " + password);
        System.out.println("Hashed: " + hashed);
    }
}
