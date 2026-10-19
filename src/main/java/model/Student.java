
package model;

public class Student {

    private int studentId;
    private String rollNo;
    private String department;
    private int semester;
    private int userId;

    public Student(int studentId, String rollNo,
                   String department, int semester, int userId) {
        this.studentId = studentId;
        this.rollNo = rollNo;
        this.department = department;
        this.semester = semester;
        this.userId = userId;
    }

    public int getStudentId() {
        return studentId;
    }

    public String getRollNo() {
        return rollNo;
    }

    public String getDepartment() {
        return department;
    }

    public int getSemester() {
        return semester;
    }

    public int getUserId() {
        return userId;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }
}
