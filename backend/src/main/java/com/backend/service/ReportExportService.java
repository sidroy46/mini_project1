package com.backend.service;

import com.backend.model.AttendanceRecord;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ReportExportService {

    public byte[] exportDailyExcel(List<AttendanceRecord> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet("Daily Attendance");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Student");
            header.createCell(1).setCellValue("Roll Number");
            header.createCell(2).setCellValue("Subject");
            header.createCell(3).setCellValue("Faculty");
            header.createCell(4).setCellValue("Date");
            header.createCell(5).setCellValue("Time");

            int rowIndex = 1;
            for (AttendanceRecord record : rows) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(record.getStudentName());
                row.createCell(1).setCellValue(record.getRollNumber());
                row.createCell(2).setCellValue(record.getSubjectName());
                row.createCell(3).setCellValue(record.getFacultyName());
                row.createCell(4).setCellValue(record.getDate().toString());
                row.createCell(5).setCellValue(record.getTime().toString());
            }

            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportDailyPdf(List<AttendanceRecord> rows) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Daily Attendance Report"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            addHeader(table, "Student");
            addHeader(table, "Roll Number");
            addHeader(table, "Subject");
            addHeader(table, "Faculty");
            addHeader(table, "Date");
            addHeader(table, "Time");

            for (AttendanceRecord record : rows) {
                table.addCell(record.getStudentName());
                table.addCell(record.getRollNumber());
                table.addCell(record.getSubjectName());
                table.addCell(record.getFacultyName());
                table.addCell(record.getDate().toString());
                table.addCell(record.getTime().toString());
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException exception) {
            throw new IOException("Failed to create PDF", exception);
        }
    }

    private void addHeader(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label));
        table.addCell(cell);
    }
}
