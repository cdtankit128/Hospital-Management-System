import io.jsonwebtoken.security.Keys;
public class TestJwt {
    public static void main(String[] args) {
        try {
            Keys.hmacShaKeyFor("YOUR_JWT_SECRET_KEY".getBytes());
            System.out.println("It worked without throwing!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
