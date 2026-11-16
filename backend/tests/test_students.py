"""Test suite for Student CRUD API"""
import pytest

def test_student_id_generation():
    """Test auto-generated student ID format"""
    from app.api.endpoints.students import generate_student_id
    sid = generate_student_id(2022, 'CSE', 1)
    assert sid == 'CSE2022001'
    sid2 = generate_student_id(2022, 'CSE', 42)
    assert sid2 == 'CSE2022042'

def test_grade_calculation():
    """Test grade and grade point calculation"""
    from app.api.endpoints.academic_records import calculate_grade
    
    grade, gp, passed = calculate_grade(92)
    assert grade == 'O' and gp == 10 and passed
    
    grade, gp, passed = calculate_grade(85)
    assert grade == 'A+' and gp == 9 and passed
    
    grade, gp, passed = calculate_grade(38)
    assert grade == 'F' and gp == 0 and not passed

def test_password_hashing():
    """Test bcrypt password hashing"""
    from app.core.security import get_password_hash, verify_password
    pwd = 'TestPassword@123'
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert len(hashed) > 0
    assert verify_password(pwd, hashed)
    assert not verify_password('wrong', hashed)

def test_jwt_encode_decode():
    """Test JWT token round-trip"""
    from app.core.security import create_access_token, decode_token
    payload = {'sub': 'abc-123', 'role': 'student'}
    token = create_access_token(payload)
    decoded = decode_token(token)
    assert decoded['sub'] == 'abc-123'
    assert decoded['role'] == 'student'
    assert decoded['type'] == 'access'
