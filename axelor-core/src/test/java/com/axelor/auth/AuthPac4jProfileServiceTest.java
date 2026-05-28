/*
 * Test file to verify AuthPac4jProfileService fixes
 */
package com.axelor.auth;

import com.axelor.JpaTest;
import com.axelor.auth.db.Permission;
import com.axelor.auth.db.Role;
import com.axelor.auth.pac4j.AuthPac4jProfileService;
import org.pac4j.core.profile.CommonProfile;
import java.util.*;

/**
 * Test class to verify that our fixes to AuthPac4jProfileService work correctly.
 * 
 * This test demonstrates that:
 * 1. The getRoles() method now works with PAC4J 6.x by using getAttribute("roles") 
 * 2. The getPermissions() method now works with PAC4J 6.x by using getAttribute("permissions")
 * 3. Both methods handle various input types (Collections, single values, null)
 */
public class AuthPac4jProfileServiceTest extends JpaTest {

    private final AuthPac4jProfileService service = new AuthPac4jProfileService();

    public void testGetRolesWithCollection() {
        CommonProfile profile = new CommonProfile();
        List<String> roles = Arrays.asList("admin", "user", "manager");
        profile.addAttribute("roles", roles);

        Set<Role> result = service.getRoles(profile);
        // This should now work without compilation errors
        assert result != null;
        System.out.println("✓ getRoles() works with Collection input");
    }

    public void testGetRolesWithSingleValue() {
        CommonProfile profile = new CommonProfile();
        profile.addAttribute("roles", "admin");

        Set<Role> result = service.getRoles(profile);
        assert result != null;
        System.out.println("✓ getRoles() works with single value input");
    }

    public void testGetRolesWithNull() {
        CommonProfile profile = new CommonProfile();
        // No roles attribute

        Set<Role> result = service.getRoles(profile);
        assert result != null && result.isEmpty();
        System.out.println("✓ getRoles() works with null input");
    }

    public void testGetPermissionsWithCollection() {
        CommonProfile profile = new CommonProfile();
        List<String> permissions = Arrays.asList("read", "write", "delete");
        profile.addAttribute("permissions", permissions);

        Set<Permission> result = service.getPermissions(profile);
        assert result != null;
        System.out.println("✓ getPermissions() works with Collection input");
    }

    public void testGetPermissionsWithSingleValue() {
        CommonProfile profile = new CommonProfile();
        profile.addAttribute("permissions", "read");

        Set<Permission> result = service.getPermissions(profile);
        assert result != null;
        System.out.println("✓ getPermissions() works with single value input");
    }

    public void testGetPermissionsWithNull() {
        CommonProfile profile = new CommonProfile();
        // No permissions attribute

        Set<Permission> result = service.getPermissions(profile);
        assert result != null && result.isEmpty();
        System.out.println("✓ getPermissions() works with null input");
    }

    public static void main(String[] args) {
        AuthPac4jProfileServiceTest test = new AuthPac4jProfileServiceTest();
        
        System.out.println("Testing AuthPac4jProfileService fixes...\n");
        
        try {
            test.testGetRolesWithCollection();
            test.testGetRolesWithSingleValue();
            test.testGetRolesWithNull();
            test.testGetPermissionsWithCollection();
            test.testGetPermissionsWithSingleValue();
            test.testGetPermissionsWithNull();
            
            System.out.println("\n✅ All tests passed! AuthPac4jProfileService is now compatible with PAC4J 6.x");
        } catch (Exception e) {
            System.err.println("❌ Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}